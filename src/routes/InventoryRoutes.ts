import { Router, Response } from 'express';
import { Inventory } from '../models/Inventory';
import { authenticateUser, AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { authorizeRole } from '../middlewares/RoleCheck';

interface InventoryTransferRequest {
  itemName: string;
  quantity: number;
  departmentid: number;
}

interface InventoryUsageUpdateRequest {
  itemName: string;
  usedQuantity: number;
  departmentid: number;
}

const router = Router();

// 🔍 View all inventory items
router.get(
  '/',
  authenticateUser,
  authorizeRole(['RootAdmin', '院长', '副院长', '部长', '职员']),
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const inventoryItems = await Inventory.findAll();
      res.status(200).json({ inventory: inventoryItems });
    } catch (error) {
      console.error('❌ 获取库存信息失败:', error);
      res.status(500).json({ message: '无法获取库存信息' });
    }
  }
);

// 🔄 Transfer stock from the main warehouse to a department
router.post(
  '/transfer',
  authenticateUser,
  authorizeRole(['RootAdmin', 'WarehouseStaff']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { itemName, quantity, departmentid }: InventoryTransferRequest = req.body;

      const warehouseItem = await Inventory.findOne({
        where: { itemname: itemName, departmentid: null },
      });

      if (!warehouseItem || warehouseItem.quantity < quantity) {
        res.status(400).json({ message: '仓库库存不足' });
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
        });
      }

      await departmentItem.save();
      res.status(200).json({ message: '库存成功转移' });
    } catch (error) {
      console.error('❌ 库存转移失败:', error);
      res.status(500).json({ message: '库存转移失败' });
    }
  }
);

// ✏️ Update daily inventory usage
router.patch(
  '/update',
  authenticateUser,
  authorizeRole(['职员', '副部长', '部长']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { itemName, usedQuantity, departmentid }: InventoryUsageUpdateRequest = req.body;

      const departmentItem = await Inventory.findOne({
        where: { itemname: itemName, departmentid },
      });

      if (!departmentItem || departmentItem.quantity < usedQuantity) {
        res.status(400).json({ message: '库存不足，无法更新' });
        return;
      }

      departmentItem.quantity -= usedQuantity;
      await departmentItem.save();

      res.status(200).json({ message: '库存使用情况已更新' });
    } catch (error) {
      console.error('❌ 更新库存使用失败:', error);
      res.status(500).json({ message: '库存使用情况更新失败' });
    }
  }
);

export default router;
