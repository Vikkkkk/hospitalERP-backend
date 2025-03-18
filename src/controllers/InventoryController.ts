import { Request, Response } from 'express';
import { InventoryService } from '../services/InventoryService';
import { InventoryRequestService } from '../services/InventoryRequestService';
import { ProcurementService } from '../services/ProcurementService';

export class InventoryController {
  /**
   * 🔍 Get inventory list (main & department inventory)
   */
  static async getInventory(req: Request, res: Response): Promise<void> {
    try {
      const { departmentId } = req.query;
      const result = await InventoryService.getInventoryWithTotalQuantity(
        departmentId ? Number(departmentId) : null
      );
      res.status(200).json(result);
    } catch (error) {
      console.error('❌ 获取库存信息失败:', error);
      res.status(500).json({ message: '无法获取库存信息' });
    }
  }

  /**
   * ➕ Add new inventory item (or restock existing)
   */
  static async addInventoryItem(req: Request, res: Response): Promise<void> {
    try {
      const { itemName, category, unit, batches, departmentId } = req.body;
      await InventoryService.addOrUpdateInventory(itemName, category, unit, batches, departmentId);
      res.status(201).json({ message: '库存物品已创建/更新' });
    } catch (error) {
      console.error('❌ 添加库存物品失败:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * 🔄 Transfer stock from main warehouse to department
   */
  static async transferStock(req: Request, res: Response): Promise<void> {
    try {
      const { itemName, quantity, departmentId } = req.body;
      await InventoryService.transferStock(itemName, quantity, departmentId);
      res.status(200).json({ message: '库存成功转移' });
    } catch (error) {
      console.error('❌ 库存转移失败:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * ✏️ Update daily inventory usage (核销物资)
   */
  static async updateUsage(req: Request, res: Response): Promise<void> {
    try {
      const { itemName, usedQuantity, departmentId } = req.body;
      await InventoryService.updateInventoryUsage(itemName, usedQuantity, departmentId);
      res.status(200).json({ message: '库存使用情况已更新' });
    } catch (error) {
      console.error('❌ 更新库存使用失败:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * 📑 Get inventory transactions (Check-in, Check-out, Restocking, Transfers)
   */
  static async getInventoryTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { departmentId, type, startDate, endDate } = req.query;
      const transactions = await InventoryService.getInventoryTransactions(
        departmentId ? Number(departmentId) : null,
        type as string,
        startDate as string,
        endDate as string
      );
      res.status(200).json(transactions);
    } catch (error) {
      console.error('❌ 获取库存交易失败:', error);
      res.status(500).json({ message: '无法获取库存交易记录' });
    }
  }

  /**
   * 📋 Fetch inventory requests (IRs)
   */
  static async getInventoryRequests(req: Request, res: Response): Promise<void> {
    try {
      const requests = await InventoryRequestService.getInventoryRequests();
      res.status(200).json(requests);
    } catch (error) {
      console.error('❌ 获取库存申请失败:', error);
      res.status(500).json({ message: '无法获取库存申请' });
    }
  }

  /**
   * ✅ Approve inventory request (Moves stock from 一级库 to 二级库)
   */
  static async approveInventoryRequest(req: Request, res: Response): Promise<void> {
    try {
      const { requestId } = req.params;
      await InventoryRequestService.processRequest(Number(requestId), 'Approved', 1);
      res.status(200).json({ message: '库存申请已批准' });
    } catch (error) {
      console.error('❌ 批准库存申请失败:', error);
      res.status(500).json({ message: '无法批准库存申请' });
    }
  }

  /**
   * ❌ Reject inventory request
   */
  static async rejectInventoryRequest(req: Request, res: Response): Promise<void> {
    try {
      const { requestId } = req.params;
      await InventoryRequestService.processRequest(Number(requestId), 'Rejected', 1);
      res.status(200).json({ message: '库存申请已拒绝' });
    } catch (error) {
      console.error('❌ 拒绝库存申请失败:', error);
      res.status(500).json({ message: '无法拒绝库存申请' });
    }
  }

  /**
   * 🛒 Fetch pending procurement requests
   */
  static async getProcurementRequests(req: Request, res: Response): Promise<void> {
    try {
      const requests = await ProcurementService.getPendingRequests();
      res.status(200).json(requests);
    } catch (error) {
      console.error('❌ 获取采购请求失败:', error);
      res.status(500).json({ message: '无法获取采购请求' });
    }
  }

  /**
   * 🚀 Submit procurement request to 采购部
   */
  static async submitProcurementRequest(req: Request, res: Response): Promise<void> {
    try {
      const { title, quantity, deadlineDate, departmentId, priorityLevel, description } = req.body;
      await ProcurementService.submitRequest(
        title, 
        description, 
        departmentId, 
        req.user!.id,  // ✅ Add `requestedBy` parameter
        priorityLevel, 
        deadlineDate, 
        quantity
      );
      res.status(201).json({ message: '采购请求已提交' });
    } catch (error) {
      console.error('❌ 提交采购请求失败:', error);
      res.status(500).json({ message: '无法提交采购请求' });
    }
  }

  /**
   * ✅ Checkout Inventory (QR Code-based)
   */
  static async checkoutInventory(req: Request, res: Response): Promise<void> {
    try {
      const { requestId, checkoutUserId } = req.body;
      await InventoryService.checkoutInventory(Number(requestId), Number(checkoutUserId));
      res.status(200).json({ message: '物资成功核销' });
    } catch (error) {
      console.error('❌ 物资核销失败:', error);
      res.status(500).json({ message: '无法核销物资' });
    }
  }
}