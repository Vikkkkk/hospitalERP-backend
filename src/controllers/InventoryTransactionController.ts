import { Request, Response } from 'express';
import { InventoryTransactionService } from '../services/InventoryTransactionService';

export class InventoryTransactionController {
  
  /**
   * 📊 Fetch check-in (入库) and check-out (核销) history for a department
   */
  static async getDepartmentTransactions(req: Request, res: Response): Promise<any> {
    try {
      const { departmentId } = req.query;
      if (!departmentId) {
        return res.status(400).json({ message: '缺少部门 ID' });
      }

      const departmentIdNum = Number(departmentId);
      if (isNaN(departmentIdNum)) {
        return res.status(400).json({ message: '无效的部门 ID' });
      }
      
      const result = await InventoryTransactionService.getDepartmentTransactions(departmentIdNum);
      res.status(200).json(result);
    } catch (error) {
      console.error('❌ 获取库存交易日志失败:', error);
      res.status(500).json({ message: '无法获取库存交易日志' });
    }
  }

  /**
   * 📦 Fetch all inventory transactions (For 后勤部职员)
   */
  static async getAllTransactions(req: Request, res: Response): Promise<any> {
    try {
      const transactions = await InventoryTransactionService.getAllTransactions();
      res.status(200).json({ transactions });
    } catch (error) {
      console.error('❌ 获取所有库存交易失败:', error);
      res.status(500).json({ message: '无法获取库存交易' });
    }
  }

  /**
   * ✅ Generate QR Code for Checkout
   */
  static async generateCheckoutQRCode(req: Request, res: Response): Promise<any> {
    try {
      const { requestId } = req.params;
      const qrCodeURL = await InventoryTransactionService.generateCheckoutQRCode(Number(requestId));

      res.status(200).json({ qrCode: qrCodeURL });
    } catch (error: unknown) { // Explicitly define error as unknown
      const errMessage = error instanceof Error ? error.message : '无法生成 QR 码';
      console.error('❌ 生成 QR 码失败:', error);
      res.status(500).json({ message: errMessage });
    }
  }

  /**
   * 🚀 Checkout an Inventory Request (Requester scans QR Code)
   */
  static async checkoutInventory(req: Request, res: Response): Promise<any> {
    try {
      const { requestId, userId } = req.body;
      const result = await InventoryTransactionService.checkoutInventory(Number(requestId), Number(userId));

      res.status(200).json(result);
    } catch (error ) {
      const errMessage = error instanceof Error ? error.message : '库存核销失败';
      console.error('❌ 核销失败:', error);
      res.status(500).json({ message: errMessage });
    }
  }
}