import { Request, Response } from 'express';
import { InventoryService } from '../services/InventoryService';

export class InventoryController {
  /**
   * 🔍 Get paginated inventory list
   */
  static async getInventory(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await InventoryService.getPaginatedInventory(Number(page), Number(limit));
      res.status(200).json(result);
    } catch (error) {
      console.error('❌ 获取库存信息失败:', error);
      res.status(500).json({ message: '无法获取库存信息' });
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
   * ✏️ Update daily inventory usage
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
}
