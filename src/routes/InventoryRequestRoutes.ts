import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { InventoryRequest } from '../models/InventoryRequest';
import { InventoryTransaction } from '../models/InventoryTransaction';
import { InventoryService } from '../services/InventoryService';
import { Inventory } from '../models/Inventory';
import { authenticateUser, AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { authorizeAccess } from '../middlewares/AccessMiddleware';
import { notifyStockRequest, notifyStockApproval, notifyLowStock, notifyPurchaseRequest } from '../services/WeComService';
import { User } from '../models/User';
import { Department } from '../models/Department';
import QRCode from 'qrcode';

const router = Router();

/**
 * 📩 Submit Inventory Request
 */
router.post('/', authenticateUser, async (req: AuthenticatedRequest, res: Response):Promise <any> => {
  try {
    const { itemName, quantity } = req.body;
    if (!itemName || !quantity || quantity <= 0) {
      return res.status(400).json({ message: '请求参数无效' });
    }

    const request = await InventoryRequest.create({
      requestedBy: req.user!.id,
      departmentId: req.user!.departmentId!,
      itemName,
      quantity,
      status: 'Pending',
    });

    await notifyStockRequest(itemName, quantity, req.user!.username);
    res.status(201).json({ message: '物资申请已提交', request });
  } catch (error) {
    console.error('❌ 申请失败:', error);
    res.status(500).json({ message: '无法提交物资申请' });
  }
});

/**
 * 🔍 View Inventory Requests (Search + Pagination)
 */
router.get('/', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, status, department, page = 1, limit = 10 } = req.query;

    const where: any = {};

    // ⬇️ Apply department filter only for non-global users
    if (!req.user!.isglobalrole && req.user!.departmentId) {
      where.departmentId = req.user!.departmentId;
    }

    // ⬇️ If frontend explicitly provides department filter, override it
    if (department && typeof department === 'string') {
      where.departmentId = department;
    }

    // ⬇️ Apply search filter on itemName
    if (search && typeof search === 'string') {
      where.itemName = { [Op.like]: `%${search}%` };
    }

    // ⬇️ Apply status filter
    if (status && typeof status === 'string') {
      where.status = status;
    }

    const { rows: requests, count } = await InventoryRequest.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      include: [
        { model: User, as: 'requestedUser', attributes: ['id', 'username'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] },
        { model: User, as: 'checkoutUserDetails', attributes: ['id', 'username'] },
      ],
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
});

/**
 * ✏️ Update Request Status (Admin)
 */
router.patch('/:id/status', authenticateUser, authorizeAccess(['后勤部职员', 'RootAdmin']), async (req: AuthenticatedRequest, res: Response):Promise <any> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['Approved', 'Rejected', 'Restocking', 'Procurement'].includes(status)) {
      return res.status(400).json({ message: '无效的状态更新' });
    }

    const request = await InventoryRequest.findByPk(id);
    if (!request) return res.status(404).json({ message: '请求未找到' });

    request.status = status;
    await request.save();

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
});

/**
 * 📲 Generate WeCom QR Login URL for Checkout
 */
router.get('/:id/checkout', authenticateUser, authorizeAccess(['后勤部职员']), async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const appId = process.env.WECOM_CORP_ID!;
    const agentId = process.env.WECOM_AGENT_ID!;
    const redirectUri = encodeURIComponent(`${process.env.BACKEND_URL}/api/wecom-callback/inventory-requests`);
    const state = id;

    const wecomLoginUrl = `https://open.work.weixin.qq.com/wwopen/sso/qrConnect?appid=${appId}&agentid=${agentId}&redirect_uri=${redirectUri}&state=${state}`;

    res.status(200).json({ qrCode: wecomLoginUrl });
  } catch (error) {
    console.error('❌ 生成二维码失败:', error);
    res.status(500).json({ message: '无法生成二维码' });
  }
});


/**
 * ✅ 手动核销 (Manual Checkout)
 */
router.post('/:id/checkout', authenticateUser, authorizeAccess(['后勤部职员']), async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { checkoutUser } = req.body;

    const request = await InventoryRequest.findByPk(id);
    if (!request || request.status !== 'Approved') {
      return res.status(400).json({ message: '只能核销已批准的申请' });
    }

    const departmentItem = await Inventory.findOne({
      where: { itemname: request.itemName, departmentId: request.departmentId },
    });

    if (!departmentItem) {
      return res.status(404).json({ message: '部门库存中找不到该物品' });
    }

    const user = await User.findOne({ where: { username: checkoutUser } });
    if (!user) return res.status(404).json({ message: '找不到该用户' });

    await InventoryTransaction.create({
      itemname: request.itemName,
      inventoryid: departmentItem.id,
      departmentId: request.departmentId,
      transactiontype: 'Checkout',
      quantity: request.quantity,
      performedby: req.user!.id,
      checkoutUser: user.id,
      category: departmentItem.category,
    });

    await InventoryService.allocateFromBatches(departmentItem.id, request.quantity);
    request.status = 'Completed';
    await request.save();

    res.status(200).json({ message: '✅ 核销成功' });
  } catch (error) {
    console.error('❌ 手动核销失败:', error);
    res.status(500).json({ message: '无法核销物资' });
  }
});


export default router;