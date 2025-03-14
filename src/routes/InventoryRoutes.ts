import { Router, Request, Response } from 'express';
import { Inventory } from '../models/Inventory';
import { InventoryTransaction } from '../models/InventoryTransaction';
import { authenticateUser, AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { authorizeAccess } from '../middlewares/AccessMiddleware';
import { Op } from 'sequelize';

interface InventoryTransferRequest {
  itemName: string;
  quantity: number;
  departmentId: number;
}

interface InventoryUsageUpdateRequest {
  itemName: string;
  usedQuantity: number;
  departmentId: number;
}

const router = Router();

/**
 * 📦 Get all inventory items with pagination
 */
router.get(
  '/',
  authenticateUser,
  authorizeAccess(['RootAdmin', '院长', '副院长', '部长', '职员']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const { rows: inventoryItems, count } = await Inventory.findAndCountAll({
        limit,
        offset,
      });

      res.status(200).json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        inventory: inventoryItems,
      });
    } catch (error) {
      console.error('❌ 获取库存信息失败:', error);
      res.status(500).json({ message: '无法获取库存信息' });
    }
  }
);

/**
 * ➕ Add a new inventory item
 */
router.post(
  '/add',
  authenticateUser,
  authorizeAccess(['RootAdmin', 'WarehouseStaff']),
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { itemname, category, unit, quantity, minimumStockLevel, restockThreshold, departmentId, supplier } = req.body;

      if (!itemname || !category || !unit || quantity < 0 || !minimumStockLevel || !restockThreshold) {
        return res.status(400).json({ message: '请求参数无效' });
      }

      const newItem = await Inventory.create({
        itemname,
        category,
        unit,
        quantity,
        minimumStockLevel,
        restockThreshold,
        departmentId: departmentId || null,
        supplier: supplier || null,
      });

      res.status(201).json({ message: '库存物品已创建', item: newItem });
    } catch (error) {
      console.error('❌ 创建库存物品失败:', error);
      res.status(500).json({ message: '创建库存物品失败' });
    }
  }
);

/**
 * 🔄 Transfer stock from warehouse to department
 */
router.post(
  '/transfer',
  authenticateUser,
  authorizeAccess(['RootAdmin', 'WarehouseStaff']),
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      console.log("📦 Transfer request body: ", req.body);

      const { itemName, quantity, departmentId }: InventoryTransferRequest = req.body;

      if (!itemName || quantity <= 0 || !departmentId) {
        return res.status(400).json({ message: '请求参数无效' });
      }

      // ✅ Retrieve item from warehouse
      const warehouseItem = await Inventory.findOne({
        where: { itemname: itemName, departmentId: null },
      });

      if (!warehouseItem) return res.status(400).json({ message: '仓库中不存在该物品' });
      if (warehouseItem.quantity < quantity) return res.status(400).json({ message: '仓库库存不足' });

      // ✅ Deduct from warehouse
      warehouseItem.quantity -= quantity;
      await warehouseItem.save();

      // ✅ Find or create the item in the department
      const [departmentItem, created] = await Inventory.findOrCreate({
        where: { itemname: itemName, departmentId },
        defaults: {
          itemname: itemName,
          category: warehouseItem.category,
          unit: warehouseItem.unit,
          quantity: 0,
          minimumStockLevel: warehouseItem.minimumStockLevel,
          restockThreshold: warehouseItem.restockThreshold,
        },
      });

      // ✅ Update quantity
      departmentItem.quantity += quantity;
      await departmentItem.save();

      // ✅ Log transaction with item name & category
      await InventoryTransaction.create({
        inventoryid: departmentItem.id,
        departmentId,
        transactiontype: 'Transfer',
        quantity,
        performedby: req.user!.id,
        itemname: departmentItem.itemname,
        category: departmentItem.category,
      });

      res.status(200).json({ message: '库存成功转移', item: departmentItem });
    } catch (error) {
      console.error('❌ 库存转移失败:', error);
      res.status(500).json({ message: '库存转移失败' });
    }
  }
);

/**
 * ✏️ Update inventory usage
 */
router.patch(
  '/update',
  authenticateUser,
  authorizeAccess(['职员', '副部长', '部长']),
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { itemName, usedQuantity, departmentId }: InventoryUsageUpdateRequest = req.body;

      if (!itemName || usedQuantity <= 0 || !departmentId) {
        return res.status(400).json({ message: '请求参数无效' });
      }

      const departmentItem = await Inventory.findOne({
        where: { itemname: itemName, departmentId },
      });

      if (!departmentItem || departmentItem.quantity < usedQuantity) {
        return res.status(400).json({ message: '库存不足，无法更新' });
      }

      departmentItem.quantity -= usedQuantity;
      await departmentItem.save();

      // ✅ Log transaction with item name & category
      await InventoryTransaction.create({
        inventoryid: departmentItem.id,
        departmentId,
        transactiontype: 'Usage',
        quantity: usedQuantity,
        performedby: req.user!.id,
        itemname: departmentItem.itemname,
        category: departmentItem.category,
      });

      res.status(200).json({ message: '库存使用情况已更新', item: departmentItem });
    } catch (error) {
      console.error('❌ 更新库存使用失败:', error);
      res.status(500).json({ message: '库存使用情况更新失败' });
    }
  }
);

/**
 * 🔄 Request Restocking
 */
router.post(
  '/restock/:id',
  authenticateUser,
  authorizeAccess(['RootAdmin', 'WarehouseStaff']),
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { id } = req.params;
      const item = await Inventory.findByPk(id);

      if (!item) return res.status(404).json({ message: '库存物品未找到' });
      if (item.quantity >= item.minimumStockLevel) return res.status(400).json({ message: '库存充足，无需补货' });

      const restockQuantity = item.minimumStockLevel - item.quantity;

      // ✅ Log transaction with item name & category
      await InventoryTransaction.create({
        inventoryid: item.id,
        departmentId: null,
        transactiontype: 'Restocking',
        quantity: restockQuantity,
        performedby: req.user!.id,
        itemname: item.itemname,
        category: item.category,
      });

      res.status(200).json({ message: '补货请求已提交', item, restockQuantity });
    } catch (error) {
      console.error('❌ 补货请求失败:', error);
      res.status(500).json({ message: '补货请求失败' });
    }
  }
);

export default router;
