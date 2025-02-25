import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { Response } from 'express';
import { ProcurementRequest } from '../models/ProcurementRequest';
import { notifyApprovalRequired } from '../services/NotificationService';
import { ApprovalService } from '../services/ApprovalService';

export class ProcurementController {
  static async submitRequest(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { title, description, departmentid, prioritylevel, deadlinedate, quantity } = req.body;

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

      const approvalId = await notifyApprovalRequired(newRequest.id, 'Director');

      newRequest.approvalId = approvalId || null;
      await newRequest.save();

      res.status(201).json({
        message: '采购请求提交成功',
        request: newRequest,
      });
    } catch (error) {
      console.error('❌ 提交采购请求失败:', error);
      res.status(500).json({ message: '提交采购请求失败' });
    }
  }

  static async getAllRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requests = await ProcurementRequest.findAll();
      res.status(200).json({ requests });
    } catch (error) {
      console.error('❌ 无法获取采购请求:', error);
      res.status(500).json({ message: '无法获取采购请求' });
    }
  }

  static async updateRequestStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const request = await ProcurementRequest.findByPk(id);
      if (!request) {
        res.status(404).json({ message: '未找到采购请求' });
        return;
      }

      request.status = status;
      await request.save();

      if (request.approvalId) {
        await ApprovalService.handleApprovalResponse(request.approvalId, status);
      }

      res.status(200).json({
        message: `请求状态已更新为 ${status}`,
        request,
      });
    } catch (error) {
      console.error('❌ 无法更新请求状态:', error);
      res.status(500).json({ message: '无法更新请求状态' });
    }
  }
}
