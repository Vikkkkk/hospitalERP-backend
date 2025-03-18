import { Inventory } from '../models/Inventory';
import { InventoryBatch } from '../models/InventoryBatch';
import { InventoryRequest } from '../models/InventoryRequest';
import { InventoryTransaction } from '../models/InventoryTransaction';
import { ProcurementRequest } from '../models/ProcurementRequest';
import { sequelize } from '../config/database';
import { Op } from 'sequelize';
import { User } from '../models/User';

export class InventoryService {
  /**
   * 🔍 Get inventory list (Main Warehouse & Department Inventory)
   */
  static async getInventory(departmentId: number | null = null) {
    return await Inventory.findAll({
      where: { departmentId },
      include: [{ model: InventoryBatch, as: 'batches' }],
    });
  }

  /**
   * 🔍 Get inventory list with total quantity which is a virtual field in frontend type. 
   */
  static async getInventoryWithTotalQuantity(departmentId: number | null = null) {
    const inventoryItems = await Inventory.findAll({
      where: { departmentId },
      include: [{ model: InventoryBatch, as: 'batches' }],
    });

    // ➕ Inject totalQuantity
    const itemsWithQuantity = inventoryItems.map(item => {
      const totalQuantity = item.batches?.reduce((sum, batch) => sum + batch.quantity, 0) || 0;
      return {
        ...item.toJSON(),
        totalQuantity,
      };
    });

    return itemsWithQuantity;
  }

  /**
   * ➕ Add new inventory item OR restock existing inventory
   * ✅ Supports batch tracking
   */
  static async addOrUpdateInventory(
    itemName: string,
    category: 'Medical Supply' | 'Drug' | 'Office Supply' | 'Equipment' | 'General',
    unit: string,
    batches: { quantity: number; expiryDate?: Date; supplier?: string }[],
    departmentId: number | null
  ) {
    return await sequelize.transaction(async (t) => {
      let inventoryItem = await Inventory.findOne({ where: { itemname: itemName, departmentId }, transaction: t });

      if (!inventoryItem) {
        inventoryItem = await Inventory.create(
          {
            itemname: itemName,
            category,
            unit,
            minimumStockLevel: 10,
            restockThreshold: 5,
            departmentId,
          },
          { transaction: t }
        );
      }

      for (const batch of batches) {
        await InventoryBatch.create(
          {
            itemId: inventoryItem.id,
            quantity: batch.quantity,
            expiryDate: batch.expiryDate || null,
            supplier: batch.supplier || null,
          },
          { transaction: t }
        );
      }
    });
  }

  /**
   * 🔄 Transfer stock from main warehouse to a department
   * ✅ Supports batch tracking
   * ✅ Auto-creates purchase request if below threshold
   */
  static async transferStock(itemName: string, quantity: number, departmentId: number) {
    return await sequelize.transaction(async (t) => {
      const warehouseItem = await Inventory.findOne({
        where: { itemname: itemName, departmentId: null },
        include: [{ model: InventoryBatch, as: 'batches' }],
        transaction: t,
      });

      if (!warehouseItem) {
        throw new Error('仓库库存不足');
      }

      let remainingQty = quantity;
      if (!warehouseItem.batches) throw new Error('未能加载批次数据');
      for (const batch of warehouseItem.batches) {
        if (remainingQty <= 0) break;
        const deducted = Math.min(batch.quantity, remainingQty);
        batch.quantity -= deducted;
        remainingQty -= deducted;
        await batch.save({ transaction: t });
      }

      // ✅ Transfer stock to department inventory
      let departmentItem = await Inventory.findOne({ where: { itemname: itemName, departmentId }, transaction: t });

      if (!departmentItem) {
        departmentItem = await Inventory.create(
          {
            itemname: itemName,
            category: warehouseItem.category,
            unit: warehouseItem.unit,
            minimumStockLevel: warehouseItem.minimumStockLevel,
            restockThreshold: warehouseItem.restockThreshold,
            departmentId,
          },
          { transaction: t }
        );
      }

      await InventoryBatch.create(
        {
          itemId: departmentItem.id,
          quantity,
          expiryDate: null,
          supplier: warehouseItem.supplier,
        },
        { transaction: t }
      );

      // ✅ Auto-create restocking request if needed
      const totalStock = await InventoryBatch.sum('quantity', { where: { itemId: warehouseItem.id } });
      if (totalStock < warehouseItem.restockThreshold) {
        await ProcurementRequest.create(
          {
            title: `Restocking Request - ${itemName}`,
            description: `库存低于阈值 (仅剩 ${totalStock})，需要补货`,
            departmentId: null, // 采购部 Todo!
            requestedBy: 1, // System generated
            priorityLevel: 'High',
            deadlineDate: new Date(),
            quantity: warehouseItem.minimumStockLevel * 2, // Suggest double the min level
            status: 'Pending',
          },
          { transaction: t }
        );
      }
    });
  }

    /**
   * 🔄 Allocate stock from batches (FIFO - First Expiry First Out)
   * ✅ Deducts stock batch-by-batch
   * ✅ Ensures oldest (earliest expiry) batches are used first
   */
    static async allocateFromBatches(inventoryId: number, requiredQuantity: number): Promise<boolean> {
      return await sequelize.transaction(async (t) => {
        const batches = await InventoryBatch.findAll({
          where: { itemId: inventoryId },
          order: [['expiryDate', 'ASC']], // ✅ Use earliest expiry first
          transaction: t,
        });
  
        let remainingQuantity = requiredQuantity;
  
        for (const batch of batches) {
          if (remainingQuantity <= 0) break;
  
          if (batch.quantity >= remainingQuantity) {
            batch.quantity -= remainingQuantity;
            remainingQuantity = 0;
          } else {
            remainingQuantity -= batch.quantity;
            batch.quantity = 0;
          }
  
          await batch.save({ transaction: t });
        }
  
        // ✅ If we couldn't fulfill the full quantity, return false
        return remainingQuantity === 0;
      });
    }

  /**
   * ✅ Checkout Inventory (核销物资)
   */
  static async checkoutInventory(requestId: number, checkoutUserId: number) {
    return await sequelize.transaction(async (t) => {
      const request = await InventoryRequest.findByPk(requestId, { transaction: t });
      if (!request || request.status !== 'Approved') {
        throw new Error('无法核销此库存申请');
      }

      const user = await User.findByPk(checkoutUserId);
      if (!user) throw new Error('用户未找到');

      // ✅ Mark as completed
      request.status = 'Completed';
      await request.save({ transaction: t });

      await InventoryTransaction.create(
        {
          inventoryid: request.id,
          departmentId: request.departmentId,
          transactiontype: 'Checkout',
          quantity: request.quantity,
          performedby: checkoutUserId,
          itemname: request.itemName,
          category: 'General',
        },
        { transaction: t }
      );
    });
  }

  /**
   * ✏️ Update daily inventory usage (Check-out process)
   */
  static async updateInventoryUsage(itemName: string, usedQuantity: number, departmentId: number) {
    return await sequelize.transaction(async (t) => {
      const departmentItem = await Inventory.findOne({
        where: { itemname: itemName, departmentId },
        include: [{ model: InventoryBatch, as: 'batches' }],
        transaction: t,
      });

      if (!departmentItem) {
        throw new Error('库存不足，无法更新');
      }

      let remainingQty = usedQuantity;
      if (!departmentItem.batches) throw new Error('未能加载批次数据');
      for (const batch of departmentItem.batches) {
        if (remainingQty <= 0) break;
        const deducted = Math.min(batch.quantity, remainingQty);
        batch.quantity -= deducted;
        remainingQty -= deducted;
        await batch.save({ transaction: t });
      }

      await InventoryTransaction.create(
        {
          inventoryid: departmentItem.id,
          departmentId,
          transactiontype: 'Usage',
          quantity: usedQuantity,
          performedby: null, // To be replaced with user ID
          itemname: itemName,
          category: departmentItem.category,
        },
        { transaction: t }
      );
    });
  }

  /**
   * 📑 Get inventory transactions (Check-in, Check-out, Restocking, Transfers)
   */
  static async getInventoryTransactions(
    departmentId: number | null = null,
    type?: string,
    startDate?: string,
    endDate?: string
  ) {
    return await InventoryTransaction.findAll({
      where: {
        ...(departmentId ? { departmentId } : {}),
        ...(type ? { transactiontype: type } : {}),
        ...(startDate && endDate
          ? { createdAt: { [Op.between]: [new Date(startDate), new Date(endDate)] } }
          : {}),
      },
    });
  }
}