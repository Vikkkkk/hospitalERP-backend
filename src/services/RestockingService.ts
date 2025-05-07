// backend-api/src/services/RestockingService.ts

import { Inventory } from '../models/Inventory';
import { InventoryBatch } from '../models/InventoryBatch';
import { ProcurementRequest } from '../models/ProcurementRequest';
import { Department } from '../models/Department';
import { notifyProcurementStaff } from './NotificationService';
import { Op } from 'sequelize';

/**
 * 🔄 Restocking Service - Handles automated stock replenishment.
 */
export class RestockingService {
  /**
   * 🚀 Automatically checks and triggers restocking if below minimum stock.
   */
  static async checkAndTriggerRestocking(): Promise<void> {
    try {
      const allItems = await Inventory.findAll();

      for (const item of allItems) {
        const totalStock = await InventoryBatch.sum('quantity', { where: { itemId: item.id } });

        if (totalStock >= item.minimumStockLevel) continue;

        const existingRequest = await ProcurementRequest.findOne({
          where: {
            title: `Restock: ${item.itemname}`,
            status: 'Pending',
          },
        });

        if (!existingRequest) {
          const department = item.departmentId ? await Department.findByPk(item.departmentId) : null;

          await ProcurementRequest.create({
            title: `Restock: ${item.itemname}`,
            description: `Automatically triggered restocking for ${item.itemname}.`,
            departmentId: item.departmentId || null,
            requestedBy: 1, // System user
            priorityLevel: 'High',
            deadlineDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            quantity: item.minimumStockLevel * 2,
            status: 'Pending',
          });

          notifyProcurementStaff(item.itemname, department?.name || 'Main Warehouse');

          if (department?.headId) {
            console.log(`📢 Notifying Department Head (${department.headId}) about low stock for ${item.itemname}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error during automatic restocking:', error);
    }
  }

  /**
   * 🛠️ Manually create a restocking request
   */
  static async createRestockingRequest(itemId: number, quantity: number, requestedBy: number) {
    const item = await Inventory.findByPk(itemId);
    if (!item) throw new Error('库存项未找到');

    await ProcurementRequest.create({
      title: `Restocking - ${item.itemname}`,
      description: `Manual restocking request for ${item.itemname}.`,
      departmentId: null,
      requestedBy,
      priorityLevel: 'High',
      deadlineDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      quantity,
      status: 'Pending',
    });

    console.log(`✅ Restocking request created for ${item.itemname}`);
  }
}

export default RestockingService;