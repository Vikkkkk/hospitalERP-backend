import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { Response, Request } from 'express';
import { ProcurementRequest } from '../models/ProcurementRequest';
import { notifyApprovalRequired } from '../services/NotificationService';
import { ApprovalService } from '../services/ApprovalService';
import { authorizeRole } from '../middlewares/RoleCheck';

export class ProcurementController {
  /**
   * 📌 Submit a Procurement Request (Only Department Heads & Admins)
   */
  static async submitRequest(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { title, description, prioritylevel, deadlinedate, quantity } = req.body;

      // ✅ Validate required fields
      if (!title || !prioritylevel || !deadlinedate || !quantity) {
        return res.status(400).json({ message: '所有字段都是必填项' });
      }

      // ✅ Ensure valid priority level
      if (!['Low', 'Medium', 'High'].includes(prioritylevel)) {
        return res.status(400).json({ message: '无效的优先级' });
      }

      // ✅ Automatically associate the request with the user's department
      const newRequest = await ProcurementRequest.create({
        title,
        description,
        departmentid: req.user!.departmentid,
        prioritylevel,
        deadlinedate,
        quantity,
        requestedby: req.user!.id,
        status: 'Pending',
      });

      // 🔔 Notify approvers (Director)
      const approvalId = await notifyApprovalRequired(newRequest.id, 'Director');

      newRequest.approvalId = approvalId;
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

  /**
   * 📋 Get All Procurement Requests (Admin & Director Access Only)
   */
  static async getAllRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
    authorizeRole(['Admin', 'Director'])(req, res, async () => {
      try {
        const requests = await ProcurementRequest.findAll();
        res.status(200).json({ requests });
      } catch (error) {
        console.error('❌ 无法获取采购请求:', error);
        res.status(500).json({ message: '无法获取采购请求' });
      }
    });
  }

  /**
   * 🔄 Update Procurement Request Status (Only Admin & Directors)
   */
  static async updateRequestStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    authorizeRole(['Admin', 'Director'])(req, res, async () => {
      try {
        const { id } = req.params;
        const { status } = req.body;

        // ✅ Ensure status is valid
        const validStatuses = ['Pending', 'Approved', 'Rejected', 'Completed'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ message: '无效的请求状态' });
        }

        const request = await ProcurementRequest.findByPk(id);
        if (!request) {
          return res.status(404).json({ message: '未找到采购请求' });
        }

        request.status = status;
        await request.save();

        // 🔔 Notify approval system if needed
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
    });
  }
}





// Key Features & Functions:
// submitRequest (Submitting Procurement Requests)

// Creates a new procurement request.
// Automatically sets the status to "Pending".
// Calls notifyApprovalRequired() to notify approvers.
// Saves the generated approvalId from approval workflow.
// getAllRequests (Retrieve All Procurement Requests)

// Fetches all procurement requests from the database.
// updateRequestStatus (Update Request Status)

// Updates the status of a procurement request.
// If it has an approval ID, it notifies the ApprovalService.