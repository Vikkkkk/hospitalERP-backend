// backend-api/src/controllers/ProcurementController.ts

import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { Response } from 'express';
import { ProcurementService } from '../services/ProcurementService';

export class ProcurementController {
  /**
   * 📌 Submit a Procurement Request (Only Department Heads & Admins)
   */
  static async submitRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, description, priorityLevel, deadlineDate, quantity } = req.body;

      if (!title || !priorityLevel || !deadlineDate || !quantity) {
        res.status(400).json({ message: '所有字段都是必填项' });
        return;
      }

      const newRequest = await ProcurementService.submitRequest(
        title,
        description,
        req.user!.departmentId!,
        req.user!.id,
        priorityLevel,
        new Date(deadlineDate),
        quantity
      );

      res.status(201).json({
        success: true,
        message: '采购请求提交成功',
        request: newRequest,
      });
    } catch (error) {
      console.error('❌ 提交采购请求失败:', error);
      res.status(500).json({ success: false, message: (error as Error).message || '提交采购请求失败' });
    }
  }

  /**
   * 📋 Get All Procurement Requests (Admin & Director Access Only)
   */
  static async getAllRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { departmentId, status, page = '1', limit = '10' } = req.query;

      const procurementRequests = await ProcurementService.getProcurementRequests(
        departmentId ? Number(departmentId) : undefined,
        status ? String(status) : undefined,
        Number(page),
        Number(limit)
      );

      res.status(200).json({ success: true, ...procurementRequests });
    } catch (error) {
      console.error('❌ 获取采购请求失败:', error);
      res.status(500).json({ success: false, message: (error as Error).message || '无法获取采购请求' });
    }
  }

  /**
   * 🔄 Update Procurement Request Status (Only Admin & Directors)
   */
  static async updateRequestStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const allowedStatuses = ['Pending', 'Approved', 'Rejected', 'Completed'];
      if (!allowedStatuses.includes(status)) {
        res.status(400).json({ message: '无效的状态值' });
        return;
      }

      const updatedRequest = await ProcurementService.updateRequestStatus(Number(id), status);

      res.status(200).json({
        success: true,
        message: `请求状态已更新为 ${status}`,
        request: updatedRequest,
      });
    } catch (error) {
      console.error('❌ 无法更新请求状态:', error);
      res.status(500).json({ success: false, message: (error as Error).message || '无法更新请求状态' });
    }
  }
}