import { Router, Response } from 'express';
import { ProcurementRequest } from '../models/ProcurementRequest';
import { authenticateUser, AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { authorizeAccess } from '../middlewares/AccessMiddleware';
import { notifyApprovalRequired, notifyPurchaseApproval, notifyPurchaseRejection } from '../services/WeComService';
import { InventoryRequest } from '../models/InventoryRequest';

const router = Router();

// Define a type for the procurement request body
interface ProcurementRequestBody {
  title: string;
  description?: string;
  departmentId: number;
  priorityLevel: 'Low' | 'Medium' | 'High';
  deadlineDate: Date;
  quantity: number;
}

// 📝 Submit a new procurement request (Includes Restocking Requests)
router.post(
  '/',
  authenticateUser,
  // authorizeAccess(['职员', '副部长', '部长']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const {
        title,
        description,
        departmentId,
        priorityLevel,
        deadlineDate,
        quantity,
      }: ProcurementRequestBody = req.body;

      // Create a new procurement request
      const newRequest = await ProcurementRequest.create({
        title,
        description,
        departmentId,
        priorityLevel,
        deadlineDate,
        quantity,
        requestedBy: req.user!.id,
        status: 'Pending',
      });

      notifyApprovalRequired(newRequest.id, '部长');

      res.status(201).json({
        message: '采购请求已成功提交。',
        request: newRequest,
      });
    } catch (error) {
      console.error('❌ 提交采购请求失败:', error);
      res.status(500).json({ message: '提交采购请求失败。' });
    }
  }
);

// 📄 View all procurement requests (Restocking Requests Included)
router.get(
  '/',
  authenticateUser,
  // authorizeAccess(['RootAdmin', '院长', '副院长', '部长', '后勤部职员']),
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const requests = await ProcurementRequest.findAll();
      res.status(200).json({ requests });
    } catch (error) {
      console.error('❌ 无法获取采购请求:', error);
      res.status(500).json({ message: '无法获取采购请求。' });
    }
  }
);

// ✅ Approve, Reject, or Return a procurement request
router.patch(
  '/:id/status',
  authenticateUser,
  authorizeAccess(['RootAdmin', '院长', '副院长']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['Pending', 'Approved', 'Rejected', 'Returned'].includes(status)) {
        res.status(400).json({ message: '无效的请求状态' });
        return;
      }

      const request = await ProcurementRequest.findByPk(id);
      if (!request) {
        res.status(404).json({ message: '未找到采购请求。' });
        return;
      }

      request.status = status;
      await request.save();

      // ✅ Notify approval or rejection
      if (status === 'Approved') {
        await notifyPurchaseApproval(request.id, request.title);
      } else if (status === 'Rejected') {
        await notifyPurchaseRejection(request.id, request.title);
      }

      res.status(200).json({
        message: `请求状态已更新为 ${status}`,
        request,
      });
    } catch (error) {
      console.error('❌ 无法更新采购请求状态:', error);
      res.status(500).json({ message: '无法更新采购请求状态。' });
    }
  }
);

export default router;