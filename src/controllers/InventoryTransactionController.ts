import { Request, Response } from 'express';
import { InventoryTransactionService } from '../services/InventoryTransactionService';

export class InventoryTransactionController {
  /**
   * 📊 Fetch check-in (入库) and check-out (核销) history for a department
   */
  static async getDepartmentTransactions(req: Request, res: Response): Promise<void> {
    try {
      const departmentId = parseInt(req.query.departmentId as string, 10);
      if (isNaN(departmentId)) {
        res.status(400).json({ message: '无效的部门 ID' });
        return;
      }

      const result = await InventoryTransactionService.getDepartmentTransactions(departmentId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('❌ 获取库存交易日志失败:', error);
      res.status(500).json({ success: false, message: '无法获取库存交易日志' });
    }
  }

  /**
   * 📦 Fetch all inventory transactions (For 后勤部职员)
   */
  static async getAllTransactions(_req: Request, res: Response): Promise<void> {
    try {
      const transactions = await InventoryTransactionService.getAllTransactions();
      res.status(200).json({ success: true, data: transactions });
    } catch (error) {
      console.error('❌ 获取所有库存交易失败:', error);
      res.status(500).json({ success: false, message: '无法获取库存交易' });
    }
  }

  /**
   * ✅ Generate QR Code for Checkout
   */
  static async generateCheckoutQRCode(req: Request, res: Response): Promise<void> {
    try {
      const requestId = parseInt(req.params.requestId, 10);
      if (isNaN(requestId)) {
        res.status(400).json({ message: '无效的请求 ID' });
        return;
      }

      const qrCodeURL = await InventoryTransactionService.generateCheckoutQRCode(requestId);
      res.status(200).json({ success: true, qrCode: qrCodeURL });
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : '无法生成 QR 码';
      console.error('❌ 生成 QR 码失败:', error);
      res.status(500).json({ success: false, message: errMessage });
    }
  }

  /**
   * 🚀 Checkout an Inventory Request (Requester scans QR Code)
   */
  static async checkoutInventory(req: Request, res: Response): Promise<void> {
    try {
      const requestId = parseInt(req.body.requestId, 10);
      const userId = parseInt(req.body.userId, 10);

      if (isNaN(requestId) || isNaN(userId)) {
        res.status(400).json({ message: '无效的请求 ID 或用户 ID' });
        return;
      }

      const result = await InventoryTransactionService.checkoutInventory(requestId, userId);
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : '库存核销失败';
      console.error('❌ 核销失败:', error);
      res.status(500).json({ success: false, message: errMessage });
    }
  }
}