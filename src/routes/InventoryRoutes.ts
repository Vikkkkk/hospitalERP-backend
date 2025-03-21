import { Router, Response } from 'express';
import { Inventory } from '../models/Inventory';
import { InventoryBatch } from '../models/InventoryBatch';
import { InventoryTransaction } from '../models/InventoryTransaction';
import { authenticateUser, AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { authorizeAccess } from '../middlewares/AccessMiddleware';
import { Op } from 'sequelize';

const router = Router();

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

// 📦 Get department inventory
router.get(
  '/department',
  authenticateUser,
  authorizeAccess(['dept-inventory'], 'read'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const requestedDeptId = req.query.departmentId ? parseInt(req.query.departmentId as string, 10) : null;
      const targetDeptId = requestedDeptId ?? req.user!.departmentId;

      const inventoryItems = await Inventory.findAll({
        where: { departmentId: targetDeptId },
        include: [{ model: InventoryBatch, as: 'batches' }],
      });

      res.status(200).json({ inventory: inventoryItems });
    } catch (error) {
      console.error('❌ 获取部门库存失败:', error);
      res.status(500).json({ message: '无法获取部门库存' });
    }
  }
);

// 📦 Get main inventory
router.get(
  '/main',
  authenticateUser,
  authorizeAccess(['main-inventory'], 'read'),
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const inventoryItems = await Inventory.findAll({
        where: { departmentId: null },
        include: [{ model: InventoryBatch, as: 'batches' }],
      });

      res.status(200).json({ inventory: inventoryItems });
    } catch (error) {
      console.error('❌ 获取一级库库存失败:', error);
      res.status(500).json({ message: '无法获取一级库库存' });
    }
  }
);

// ➕ Add new inventory item (Procurement)
router.post(
  '/add',
  authenticateUser,
  authorizeAccess(['main-inventory'], 'write'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const {
        itemname, category, unit, minimumStockLevel, restockThreshold,
        departmentId, supplier, batches, totalQuantity,
      } = req.body;

      if (!itemname || !category || !unit || minimumStockLevel === undefined || restockThreshold === undefined) {
        res.status(400).json({ message: '❌ 请求参数无效' });
        return;
      }

      if ((!Array.isArray(batches) || batches.length === 0) && !totalQuantity) {
        res.status(400).json({ message: '❌ 请提供总库存或批次信息' });
        return;
      }

      const newItem = await Inventory.create({
        itemname, category, unit, minimumStockLevel, restockThreshold,
        departmentId: departmentId || req.user!.departmentId,
        supplier: supplier || null,
      });

      let totalQtyLogged = 0;

      if (totalQuantity) {
        await InventoryBatch.create({
          itemId: newItem.id,
          quantity: totalQuantity,
          expiryDate: null,
          supplier: supplier || null,
        });
        totalQtyLogged = totalQuantity;
      } else {
        for (const batch of batches) {
          await InventoryBatch.create({
            itemId: newItem.id,
            quantity: batch.quantity,
            expiryDate: batch.expiryDate || null,
            supplier: batch.supplier || supplier || null,
          });
          totalQtyLogged += batch.quantity;
        }
      }

      await InventoryTransaction.create({
        inventoryid: newItem.id,
        departmentId: null,
        transactiontype: 'Procurement',
        quantity: totalQtyLogged,
        performedby: req.user!.id,
        itemname: newItem.itemname,
        category: newItem.category,
      });

      const fullItem = await Inventory.findByPk(newItem.id, {
        include: [{ model: InventoryBatch, as: 'batches' }],
      });

      res.status(201).json({ message: '✅ 库存物品已创建', item: fullItem });
    } catch (error) {
      console.error('❌ 创建库存物品失败:', error);
      res.status(500).json({ message: '❌ 创建库存物品失败' });
    }
  }
);

// 🔄 Transfer stock
router.post(
  '/transfer',
  authenticateUser,
  authorizeAccess(['main-inventory'], 'write'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { itemName, quantity, departmentId }: InventoryTransferRequest = req.body;

      if (!itemName || quantity <= 0 || !departmentId) {
        res.status(400).json({ message: '请求参数无效' });
        return;
      }

      const warehouseItem = await Inventory.findOne({
        where: { itemname: itemName, departmentId: null },
        include: [{ model: InventoryBatch, as: 'batches' }],
      });

      if (!warehouseItem?.batches || warehouseItem.batches.length === 0) {
        res.status(400).json({ message: '仓库中不存在该物品或无库存' });
        return;
      }

      let remainingQty = quantity;
      for (const batch of warehouseItem.batches) {
        if (remainingQty <= 0) break;
        const deducted = Math.min(batch.quantity, remainingQty);
        batch.quantity -= deducted;
        remainingQty -= deducted;
        await batch.save();
      }

      const [departmentItem] = await Inventory.findOrCreate({
        where: { itemname: itemName, departmentId },
        defaults: {
          itemname: itemName,
          category: warehouseItem.category,
          unit: warehouseItem.unit,
          minimumStockLevel: warehouseItem.minimumStockLevel,
          restockThreshold: warehouseItem.restockThreshold,
        },
      });

      await InventoryBatch.create({
        itemId: departmentItem.id,
        quantity,
        expiryDate: null,
        supplier: warehouseItem.supplier,
      });

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

// ✏️ Update inventory usage
router.patch(
  '/update',
  authenticateUser,
  authorizeAccess(['dept-inventory'], 'write'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { itemName, usedQuantity, departmentId }: InventoryUsageUpdateRequest = req.body;

      if (!itemName || usedQuantity <= 0 || !departmentId) {
        res.status(400).json({ message: '请求参数无效' });
        return;
      }

      const departmentItem = await Inventory.findOne({
        where: { itemname: itemName, departmentId },
        include: [{ model: InventoryBatch, as: 'batches' }],
      });

      if (!departmentItem?.batches || departmentItem.batches.length === 0) {
        res.status(400).json({ message: '仓库中不存在该物品或无库存' });
        return;
      }

      let remainingQty = usedQuantity;
      for (const batch of departmentItem.batches) {
        if (remainingQty <= 0) break;
        const deducted = Math.min(batch.quantity, remainingQty);
        batch.quantity -= deducted;
        remainingQty -= deducted;
        await batch.save();
      }

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

// ♻️ Restock inventory
router.post(
  '/restock/:id',
  authenticateUser,
  authorizeAccess(['main-inventory'], 'write'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const itemId = parseInt(req.params.id, 10);
      const { batches } = req.body;

      if (!itemId || !Array.isArray(batches) || batches.length === 0) {
        res.status(400).json({ message: '❌ 无效的请求数据' });
        return;
      }

      const inventoryItem = await Inventory.findOne({
        where: { id: itemId, departmentId: null },
        include: [{ model: InventoryBatch, as: 'batches' }],
      });

      if (!inventoryItem) {
        res.status(404).json({ message: '❌ 未找到主库存物品' });
        return;
      }

      let totalQtyLogged = 0;
      for (const batch of batches) {
        await InventoryBatch.create({
          itemId: inventoryItem.id,
          quantity: batch.quantity,
          expiryDate: batch.expiryDate || null,
          supplier: batch.supplier || inventoryItem.supplier || null,
        });
        totalQtyLogged += batch.quantity;
      }

      await InventoryTransaction.create({
        inventoryid: inventoryItem.id,
        departmentId: null,
        transactiontype: 'Restocking',
        quantity: totalQtyLogged,
        performedby: req.user!.id,
        itemname: inventoryItem.itemname,
        category: inventoryItem.category,
      });

      const updatedItem = await Inventory.findByPk(itemId, {
        include: [{ model: InventoryBatch, as: 'batches' }],
      });

      res.status(200).json({ message: '✅ 物资补充成功', item: updatedItem });
    } catch (error) {
      console.error('❌ 物资补充失败:', error);
      res.status(500).json({ message: '❌ 补充库存失败' });
    }
  }
);

export default router;