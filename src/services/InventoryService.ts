import { Inventory } from '../models/Inventory';
import { InventoryBatch } from '../models/InventoryBatch';
import { InventoryRequest } from '../models/InventoryRequest';
import { InventoryTransaction } from '../models/InventoryTransaction';
import { ProcurementRequest } from '../models/ProcurementRequest';
import { sequelize } from '../config/database';
import { Op } from 'sequelize';
import { User } from '../models/User';

export class InventoryService {
  static async getInventory(departmentId: number | null = null) {
    return await Inventory.findAll({
      where: { departmentId },
      include: [{ model: InventoryBatch, as: 'batches' }],
    });
  }

  static async getInventoryWithTotalQuantity(departmentId: number | null = null) {
    const sanitizedDeptId = departmentId === 0 ? null : departmentId;
    console.log('📦 Loading inventory for department:', sanitizedDeptId);

    const inventoryItems = await Inventory.findAll({
      where: { departmentId: sanitizedDeptId },
      include: [{ model: InventoryBatch, as: 'batches' }],
    });

    return inventoryItems.map(item => {
      const totalQuantity = item.batches?.reduce((sum, batch) => sum + batch.quantity, 0) || 0;
      return {
        ...item.toJSON(),
        totalQuantity,
      };
    });
  }

  static async addOrUpdateInventory(
    itemName: string,
    category: 'Medical Supply' | 'Drug' | 'Office Supply' | 'Equipment' | 'General',
    unit: string,
    batches: { quantity: number; expiryDate?: Date; supplier?: string }[],
    departmentId: number | null
  ) {
    console.log('🚨 Adding inventory with departmentId:', departmentId);
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

      const totalStock = await InventoryBatch.sum('quantity', { where: { itemId: warehouseItem.id } });
      if (totalStock < warehouseItem.restockThreshold) {
        await ProcurementRequest.create(
          {
            title: `Restocking Request - ${itemName}`,
            description: `库存低于阈值 (仅剩 ${totalStock})，需要补货`,
            departmentId: null,
            requestedBy: 1,
            priorityLevel: 'High',
            deadlineDate: new Date(),
            quantity: warehouseItem.minimumStockLevel * 2,
            status: 'Pending',
          },
          { transaction: t }
        );
      }
    });
  }

  static async allocateFromBatches(inventoryId: number, requiredQuantity: number): Promise<boolean> {
    return await sequelize.transaction(async (t) => {
      const batches = await InventoryBatch.findAll({
        where: { itemId: inventoryId },
        order: [['expiryDate', 'ASC']],
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

      return remainingQuantity === 0;
    });
  }

  static async checkoutInventory(requestId: number, checkoutUserId: number) {
    return await sequelize.transaction(async (t) => {
      const request = await InventoryRequest.findByPk(requestId, { transaction: t });
      if (!request || request.status !== 'Approved') {
        throw new Error('无法核销此库存申请');
      }

      const user = await User.findByPk(checkoutUserId);
      if (!user) throw new Error('用户未找到');

      request.status = 'Completed';
      request.checkoutUser = checkoutUserId;
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
          performedby: null,
          itemname: itemName,
          category: departmentItem.category,
        },
        { transaction: t }
      );
    });
  }

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