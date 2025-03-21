import { Op } from 'sequelize';
import { ProcurementRequest } from '../models/ProcurementRequest';
import { notifyApprovalRequired } from '../services/NotificationService';
import { User } from '../models/User';
import { Department } from '../models/Department';

export class ProcurementService {
  /**
   * 📌 Submit a Procurement Request
   * - This is triggered when:
   *   1️⃣ An IR cannot be fulfilled from main inventory
   *   2️⃣ 后勤部 manually submits a procurement request
   */
  static async submitRequest(
    title: string, 
    description: string,
    departmentId: number,
    requestedBy: number,
    priorityLevel: 'Low' | 'Medium' | 'High',
    deadlineDate: Date,
    quantity: number
  ) {
    if (!title || !priorityLevel || !deadlineDate || !quantity) {
      throw new Error('所有字段都是必填项');
    }

    // ✅ Ensure valid priority level
    if (!['Low', 'Medium', 'High'].includes(priorityLevel)) {
      throw new Error('无效的优先级');
    }

    // ✅ Create a new procurement request
    const newRequest = await ProcurementRequest.create({
      title: `Procurement - ${title}`, // ✅ Automatically generate title
      description: description || `Auto-generated procurement request for ${title}`,
      departmentId,
      priorityLevel,
      deadlineDate,
      quantity,
      requestedBy: 1, // ✅ System-generated request
      status: 'Pending',
    });

    // 🔔 Notify approvers (采购部)
    await notifyApprovalRequired(newRequest.id, '采购部');

    return newRequest;
  }

  /**
   * 📋 Fetch All Procurement Requests (With Filters & Pagination)
   */
  static async getProcurementRequests(
    departmentId?: number,
    status?: string,
    page: number = 1,
    limit: number = 10
  ) {
    const offset = (page - 1) * limit;

    const whereCondition: any = {};

    if (departmentId) {
      whereCondition.departmentId = departmentId;
    }
    if (status) {
      whereCondition.status = status;
    }

    const { rows: requests, count } = await ProcurementRequest.findAndCountAll({
      where: whereCondition,
      include: [
        { model: User, as: 'requester', attributes: ['id', 'username'] },
        { model: Department, as: 'userDepartment', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      requests,
    };
  }

  /**
   * 📌 Fetch Pending Procurement Requests
   * - Used in InventoryController.ts to list pending requests
   */
  static async getPendingRequests() {
    return await ProcurementRequest.findAll({
      where: { status: 'Pending' },
      include: [{ model: Department, as: 'userDepartment', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * 🔄 Update Procurement Request Status (Approve / Reject / Complete)
   */
  static async updateRequestStatus(requestId: number, status: 'Pending' | 'Approved' | 'Rejected' | 'Completed') {
    const request = await ProcurementRequest.findByPk(requestId);

    if (!request) {
      throw new Error('未找到采购请求');
    }

    // ✅ Ensure status is valid
    if (!['Pending', 'Approved', 'Rejected', 'Completed'].includes(status)) {
      throw new Error('无效的请求状态');
    }

    request.status = status;
    await request.save();

    return request;
  }
}