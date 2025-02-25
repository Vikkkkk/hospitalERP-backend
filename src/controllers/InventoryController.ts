// backend-api/src/controllers/InventoryController.ts

import { Request, Response } from 'express';
import { Inventory } from '../models/Inventory';
import { InventoryTransaction } from '../models/InventoryTransaction';

export class InventoryController {
  // Get all inventory items
  static async getAllInventory(req: Request, res: Response): Promise<void> {
    try {
      const inventoryItems = await Inventory.findAll();
      res.status(200).json({ inventory: inventoryItems });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: '无法获取库存项目' });
    }
  }

  // Transfer stock from main warehouse to department
  static async transferStock(req: Request, res: Response): Promise<void> {
    try {
      const { itemName, quantity, departmentid } = req.body;

      const warehouseItem = await Inventory.findOne({
        where: { itemname: itemName, departmentid: null },
      });

      if (!warehouseItem || warehouseItem.quantity < quantity) {
        res.status(400).json({ message: '库存不足，无法转移' });
        return;
      }

      warehouseItem.quantity -= quantity;
      await warehouseItem.save();

      let departmentItem = await Inventory.findOne({
        where: { itemname: itemName, departmentid },
      });

      if (departmentItem) {
        departmentItem.quantity += quantity;
      } else {
        departmentItem = await Inventory.create({
          itemname: itemName,
          quantity,
          departmentid,
          minimumstocklevel: 10,
          lastRestocked: new Date(),
        });
      }

      await departmentItem.save();

      // Log transaction
      await InventoryTransaction.create({
        inventoryid: warehouseItem.id,
        departmentid,
        transactiontype: 'Transfer',
        quantity,
        performedby: req.user!.id, // Authenticated user
      });

      res.status(200).json({ message: '库存转移成功' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: '库存转移失败' });
    }
  }

  // Update daily inventory usage
  static async updateUsage(req: Request, res: Response): Promise<void> {
    try {
      const { itemName, usedQuantity, departmentid } = req.body;

      const departmentItem = await Inventory.findOne({
        where: { itemname: itemName, departmentid },
      });

      if (!departmentItem || departmentItem.quantity < usedQuantity) {
        res.status(400).json({ message: '库存不足，无法更新' });
        return;
      }

      departmentItem.quantity -= usedQuantity;
      await departmentItem.save();

      // Log transaction
      await InventoryTransaction.create({
        inventoryid: departmentItem.id,
        departmentid,
        transactiontype: 'Usage',
        quantity: usedQuantity,
        performedby: req.user!.id,
      });

      res.status(200).json({ message: '库存使用情况已更新' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: '无法更新库存使用情况' });
    }
  }
}
