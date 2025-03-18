import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { Response } from 'express';
import { ProcurementService } from '../services/ProcurementService';
import { authorizeAccess } from '../middlewares/AccessMiddleware';

export class ProcurementController {
  /**
   * 📌 Submit a Procurement Request (Only Department Heads & Admins)
   */
  static async submitRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, description, priorityLevel, deadlineDate, quantity } = req.body;

      // ✅ Call ProcurementService to handle logic
      const newRequest = await ProcurementService.submitRequest(
        title,
        description,
        req.user!.departmentId!,
        req.user!.id,
        priorityLevel,
        deadlineDate,
        quantity
      );

      res.status(201).json({
        message: '采购请求提交成功',
        request: newRequest,
      });
    } catch (error) {
      console.error('❌ 提交采购请求失败:', error);
      res.status(500).json({ message: (error as Error).message || '提交采购请求失败' });
    }
  }

  /**
   * 📋 Get All Procurement Requests (Admin & Director Access Only)
   */
  static async getAllRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { departmentId, status, page, limit } = req.query;

      const procurementRequests = await ProcurementService.getProcurementRequests(
        departmentId ? Number(departmentId) : undefined,
        status ? String(status) : undefined,
        page ? Number(page) : 1,
        limit ? Number(limit) : 10
      );

      res.status(200).json(procurementRequests);
    } catch (error) {
      console.error('❌ 获取采购请求失败:', error);
      res.status(500).json({ message: (error as Error).message || '无法获取采购请求' });
    }
  }

  /**
   * 🔄 Update Procurement Request Status (Only Admin & Directors)
   */
  static async updateRequestStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // ✅ Update status using service
      const updatedRequest = await ProcurementService.updateRequestStatus(Number(id), status);

      res.status(200).json({
        message: `请求状态已更新为 ${status}`,
        request: updatedRequest,
      });
    } catch (error) {
      console.error('❌ 无法更新请求状态:', error);
      res.status(500).json({ message: (error as Error).message || '无法更新请求状态' });
    }
  }
}