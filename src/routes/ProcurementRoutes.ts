import { Router, Response } from 'express';
import { ProcurementRequest } from '../models/ProcurementRequest';
import { authenticateUser, AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { authorizeRole } from '../middlewares/RoleCheck';
import { notifyApprovalRequired } from '../services/NotificationService';

const router = Router();

// Define a type for the procurement request body
interface ProcurementRequestBody {
  title: string;
  description?: string;
  departmentid: number;
  prioritylevel: 'Low' | 'Medium' | 'High';
  deadlinedate: Date;
  quantity: number;
}

// 📝 Submit a new procurement request
router.post(
  '/',
  authenticateUser,
  authorizeRole(['职员', '副部长', '部长']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const {
        title,
        description,
        departmentid,
        prioritylevel,
        deadlinedate,
        quantity,
      }: ProcurementRequestBody = req.body;

      // Create a new procurement request
      const newRequest = await ProcurementRequest.create({
        title,
        description,
        departmentid,
        prioritylevel,
        deadlinedate,
        quantity,
        requestedby: req.user!.id,
        status: 'Pending',
      });

      // Send approval notification (Simulated for now)
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

// 📄 View all procurement requests (RootAdmin, 院长, 副院长, 部长)
router.get(
  '/',
  authenticateUser,
  authorizeRole(['RootAdmin', '院长', '副院长', '部长']),
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

// ✅ Approve, reject, or return a procurement request
router.patch(
  '/:id/status',
  authenticateUser,
  authorizeRole(['RootAdmin', '院长', '副院长']),
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
