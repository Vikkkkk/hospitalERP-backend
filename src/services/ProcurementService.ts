import { Op } from 'sequelize';
import { ProcurementRequest } from '../models/ProcurementRequest';
import { notifyApprovalRequired } from '../services/NotificationService';
import { User } from '../models/User';
import { Department } from '../models/Department';

export class ProcurementService {
  /**
   * 📌 Submit a Procurement Request
   * - Triggered when:
   *   1️⃣ An IR cannot be fulfilled from main inventory
   *   2️⃣ 后勤部 manually submits a request
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

    if (!['Low', 'Medium', 'High'].includes(priorityLevel)) {
      throw new Error('无效的优先级');
    }

    const newRequest = await ProcurementRequest.create({
      title: `Procurement - ${title}`,
      description: description || `Auto-generated procurement request for ${title}`,
      departmentId,
      priorityLevel,
      deadlineDate,
      quantity,
      requestedBy,
      status: 'Pending',
    });

    await notifyApprovalRequired(newRequest.id, '采购部');

    return newRequest;
  }

  /**
   * 📋 Fetch Procurement Requests (Supports pagination + filters)
   */
  static async getProcurementRequests(
    departmentId?: number,
    status?: string,
    page: number = 1,
    limit: number = 10
  ) {
    const offset = (page - 1) * limit;
    const whereCondition: any = {};

    if (departmentId) whereCondition.departmentId = departmentId;
    if (status) whereCondition.status = status;

    const { rows: requests, count } = await ProcurementRequest.findAndCountAll({
      where: whereCondition,
      include: [
        { model: User, as: 'requester', attributes: ['id', 'username'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] },
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
   * 📌 Get Pending Procurement Requests (e.g. for review dashboards)
   */
  static async getPendingRequests() {
    return await ProcurementRequest.findAll({
      where: { status: 'Pending' },
      include: [{ model: Department, as: 'department', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * 🔄 Update Procurement Request Status
   */
  static async updateRequestStatus(requestId: number, status: 'Pending' | 'Approved' | 'Rejected' | 'Completed') {
    const request = await ProcurementRequest.findByPk(requestId);
    if (!request) throw new Error('未找到采购请求');

    if (!['Pending', 'Approved', 'Rejected', 'Completed'].includes(status)) {
      throw new Error('无效的请求状态');
    }

    request.status = status;
    await request.save();

    return request;
  }
}