// backend-api/src/services/RestockingService.ts

import { Inventory } from '../models/Inventory';
import { InventoryBatch } from '../models/InventoryBatch';
import { ProcurementRequest } from '../models/ProcurementRequest';
import { Department } from '../models/Department';
import { notifyProcurementStaff } from './NotificationService';
import { Op } from 'sequelize';
import { sequelize } from '../models';

/**
 * 🔄 Restocking Service - Handles automated stock replenishment.
 */
export class RestockingService {
  /**
   * 🚀 Check for low-stock inventory and trigger restocking requests.
   */
  static async checkAndTriggerRestocking(): Promise<void> {
    try {
      // ✅ Find all items where total batch stock is below the minimum stock level
      const lowStockItems = await Inventory.findAll();

      for (const item of lowStockItems) {
        // ✅ Calculate total stock from batches
        const totalStock = await InventoryBatch.sum('quantity', { where: { itemId: item.id } });

        if (totalStock >= item.minimumStockLevel) {
          continue; // ✅ Skip items that still have enough stock
        }

        // ✅ Check if a pending restocking request already exists
        const existingRequest = await ProcurementRequest.findOne({
          where: {
            title: `Restock: ${item.itemname}`,
            status: 'Pending',
          },
        });

        // ✅ If no pending request, create a new one
        if (!existingRequest) {
          const department = item.departmentId ? await Department.findByPk(item.departmentId) : null;

          await ProcurementRequest.create({
            title: `Restock: ${item.itemname}`,
            description: `Automatically triggered restocking for ${item.itemname}.`,
            departmentId: item.departmentId || null,
            requestedBy: 1, // System user ID placeholder
            priorityLevel: 'High',
            deadlineDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3-day deadline
            quantity: item.minimumStockLevel * 2, // 🚀 Request double the minimum to avoid frequent shortages
            status: 'Pending',
          });

          // ✅ Send notifications
          notifyProcurementStaff(item.itemname, department ? department.name : 'Main Warehouse');

          if (department) {
            // Notify department head if stock is for a specific department
            const departmentHead = await department.get('headId');
            if (departmentHead) {
              console.log(`📢 Notifying Department Head (${departmentHead}) about low stock for ${item.itemname}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error during automatic restocking:', error);
    }
  }

  /**
   * 📦 Create a restocking request manually
   */
  static async createRestockingRequest(itemId: number, quantity: number, requestedBy: number) {
    const item = await Inventory.findByPk(itemId);
    if (!item) throw new Error('库存项未找到');

    await ProcurementRequest.create({
      title: `Restocking - ${item.itemname}`,
      description: `Manual restocking request for ${item.itemname}.`,
      departmentId: null, // Main warehouse restocking
      requestedBy,
      priorityLevel: 'High',
      deadlineDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7-day deadline
      quantity,
      status: 'Pending',
    });

    console.log(`✅ Restocking request created for ${item.itemname}`);
  }
}

// ✅ Properly export the RestockingService
export default RestockingService;