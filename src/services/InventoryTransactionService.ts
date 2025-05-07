import { InventoryTransaction } from '../models/InventoryTransaction';
import { Inventory } from '../models/Inventory';
import { InventoryRequest } from '../models/InventoryRequest';
import { User } from '../models/User';
import QRCode from 'qrcode';

export class InventoryTransactionService {
  /**
   * 📊 Fetch check-in and check-out history for a department
   */
  static async getDepartmentTransactions(departmentId: number) {
    const transactions = await InventoryTransaction.findAll({
      where: { departmentId },
      include: [
        { model: Inventory, as: 'inventoryItem' },
        { model: User, as: 'performedByUser', attributes: ['id', 'username'] },
        { model: User, as: 'checkoutUserInfo', attributes: ['id', 'username'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    return {
      checkInHistory: transactions.filter(t => t.transactiontype === 'Transfer'),
      checkOutHistory: transactions.filter(t => t.transactiontype === 'Usage' || t.transactiontype === 'Checkout'),
    };
  }

  /**
   * 📦 Fetch all inventory transactions (For 后勤部职员)
   */
  static async getAllTransactions() {
    return await InventoryTransaction.findAll({
      include: [
        { model: Inventory, as: 'inventoryItem' },
        { model: User, as: 'performedByUser', attributes: ['id', 'username'] },
        { model: User, as: 'checkoutUserInfo', attributes: ['id', 'username'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * ✅ Generate QR Code for Checkout
   */
  static async generateCheckoutQRCode(requestId: number) {
    const request = await InventoryRequest.findByPk(requestId);
    if (!request) throw new Error('未找到库存请求');

    if (request.status !== 'Approved') {
      throw new Error('此请求未被批准');
    }

    const checkoutData = {
      requestId,
      departmentId: request.departmentId,
      itemName: request.itemName,
      quantity: request.quantity,
    };

    return await QRCode.toDataURL(JSON.stringify(checkoutData));
  }

  /**
   * 🚀 Checkout an Inventory Request (Requester scans QR Code)
   */
  static async checkoutInventory(requestId: number, userId: number) {
    const request = await InventoryRequest.findByPk(requestId);
    if (!request) throw new Error('库存请求未找到');

    if (request.status !== 'Approved') {
      throw new Error('此请求未被批准');
    }

    const user = await User.findByPk(userId);
    if (!user) throw new Error('用户未找到');

    await InventoryTransaction.create({
      itemname: request.itemName,
      category: 'General',
      inventoryid: requestId,
      departmentId: request.departmentId,
      transactiontype: 'Checkout',
      quantity: request.quantity,
      performedby: userId,
      checkoutUser: request.requestedBy,
    });

    request.status = 'Completed';
    await request.save();

    return { message: '库存已成功核销' };
  }
}