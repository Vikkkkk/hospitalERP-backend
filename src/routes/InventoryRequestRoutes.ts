import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { InventoryRequest } from '../models/InventoryRequest';
import { InventoryTransaction } from '../models/InventoryTransaction';
import { InventoryService } from '../services/InventoryService';
import { Inventory } from '../models/Inventory';
import { authenticateUser, AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { authorizeAccess } from '../middlewares/AccessMiddleware';
import { notifyStockRequest, notifyStockApproval, notifyLowStock, notifyPurchaseRequest } from '../services/WeComService';
import QRCode from 'qrcode';

const router = Router();

/**
 * 📥 Create an Inventory Request (Department Staff can request items)
 */
router.post(
  '/',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { itemName, quantity } = req.body;

      if (!itemName || !quantity || quantity <= 0) {
        return res.status(400).json({ message: '请求参数无效' });
      }

      // ✅ Create Request
      const request = await InventoryRequest.create({
        requestedBy: req.user!.id,
        departmentId: req.user!.departmentId!,
        itemName,
        quantity,
        status: 'Pending',
      });

      // ✅ Notify 后勤部职员
      await notifyStockRequest(itemName, quantity, req.user!.username);

      res.status(201).json({ message: '物资申请已提交', request });
    } catch (error) {
      console.error('❌ 申请失败:', error);
      res.status(500).json({ message: '无法提交物资申请' });
    }
  }
);

/**
 * 🔍 View All Inventory Requests (Filtered & Searchable)
 */
router.get(
  '/',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const departmentId = req.user!.departmentId;
      const { search, status, page = 1, limit = 10 } = req.query;

      const whereCondition: any = { departmentId };

      // ✅ Apply search filter if a search term is provided
      if (search && typeof search === 'string') {
        whereCondition.itemName = { [Op.like]: `%${search}%` };
      }

      if (status && typeof status === 'string') {
        whereCondition.status = status;
      }

      // ✅ Fetch inventory requests with pagination
      const { rows: requests, count } = await InventoryRequest.findAndCountAll({
        where: whereCondition,
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit),
      });

      res.status(200).json({
        totalItems: count,
        totalPages: Math.ceil(count / Number(limit)),
        currentPage: Number(page),
        requests,
      });
    } catch (error) {
      console.error('❌ 获取申请失败:', error);
      res.status(500).json({ message: '无法获取物资申请' });
    }
  }
);

/**
 * 📝 Approve, Reject, Restock, or Convert to Purchase Order
 */
router.patch(
  '/:id/status',
  authenticateUser,
  authorizeAccess(['后勤部职员', 'RootAdmin']),
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!['Approved', 'Rejected', 'Restocking', 'Procurement'].includes(status)) {
        return res.status(400).json({ message: '无效的状态更新' });
      }

      const request = await InventoryRequest.findByPk(id);
      if (!request) {
        return res.status(404).json({ message: '请求未找到' });
      }

      request.status = status;
      await request.save();

      // ✅ Notify the requester
      if (status === 'Approved') {
        await notifyStockApproval(request.requestedBy.toString(), request.itemName, request.quantity);
      } else if (status === 'Restocking') {
        await notifyLowStock(request.itemName, request.quantity);
      } else if (status === 'Procurement') {
        await notifyPurchaseRequest(request.itemName, request.quantity, req.user!.username);
      } else if (status === 'Rejected' && notes) {
        await notifyStockApproval(request.requestedBy.toString(), `❌ 你的申请被拒绝: ${notes}`, request.quantity);
      }

      res.status(200).json({ message: '请求状态已更新', request });
    } catch (error) {
      console.error('❌ 状态更新失败:', error);
      res.status(500).json({ message: '无法更新申请状态' });
    }
  }
);

/**
 * ✅ Checkout Items (Generate QR Code)
 */
router.patch(
  '/:id/checkout',
  authenticateUser,
  authorizeAccess(['后勤部职员']),
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { id } = req.params;
      const { username } = req.body; // User who is picking up the item

      const request = await InventoryRequest.findByPk(id);
      if (!request || request.status !== 'Approved') {
        return res.status(400).json({ message: '只能核销已批准的申请' });
      }

      // ✅ Find department inventory item
      let departmentItem = await Inventory.findOne({
        where: { itemname: request.itemName, departmentId: request.departmentId },
      });

      if (!departmentItem) {
        return res.status(400).json({ message: '部门库存中找不到该物品' });
      }

      // ✅ Generate QR Code
      const qrData = JSON.stringify({
        requestId: request.id,
        itemName: request.itemName,
        quantity: request.quantity,
        departmentId: request.departmentId,
        checkedOutBy: username,
      });

      const qrCodeImage = await QRCode.toDataURL(qrData);

      // ✅ Log the transaction
      await InventoryTransaction.create({
        itemname: request.itemName,
        inventoryid: departmentItem.id,
        departmentId: request.departmentId,
        transactiontype: 'Checkout',
        quantity: request.quantity,
        performedby: req.user!.id,
        checkoutUser: username,
        category: departmentItem.category,
      });

      // ✅ Update inventory
      await InventoryService.allocateFromBatches(departmentItem.id, request.quantity);
      await departmentItem.save();

      // ✅ Mark request as completed
      request.status = 'Completed';
      await request.save();

      res.status(200).json({ message: '核销成功', qrCode: qrCodeImage });
    } catch (error) {
      console.error('❌ 核销失败:', error);
      res.status(500).json({ message: '无法核销物资' });
    }
  }
);

export default router;