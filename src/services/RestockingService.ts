// backend-api/src/services/RestockingService.ts

import { Inventory } from '../models/Inventory';
import { ProcurementRequest } from '../models/ProcurementRequest';
import { Department } from '../models/Department';
import { notifyProcurementStaff } from './NotificationService';
import { Op } from 'sequelize';
import { sequelize } from '../models';

/**
 * 🔄 Automatically checks for low-stock inventory and triggers restocking requests.
 */
export const checkAndTriggerRestocking = async (): Promise<void> => {
  try {
    // Find all items with quantity below the minimum stock level
    const lowStockItems = await Inventory.findAll({
      where: {
        quantity: { [Op.lt]: sequelize.col('minimumStockLevel') }, // Use consistent column name
      },
    });

    // Loop through all low-stock items and process restocking
    for (const item of lowStockItems) {
      const existingRequest = await ProcurementRequest.findOne({
        where: {
          title: `Restock: ${item.itemname}`, // Use correct field name
          status: 'Pending',
        },
      });

      // Create a new restocking request if no pending request exists
      if (!existingRequest) {
        const department = item.departmentId
          ? await Department.findByPk(item.departmentId)
          : null;

        await ProcurementRequest.create({
          title: `Restock: ${item.itemname}`,
          description: `Automatically triggered restocking for ${item.itemname}.`,
          departmentId: item.departmentId || null,
          requestedby: 1, // System user ID placeholder
          prioritylevel: 'High',
          deadlinedate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3-day deadline
          quantity: item.minimumStockLevel - item.quantity, // Request enough to reach minimum
          status: 'Pending',
        });

        // Send notification
        notifyProcurementStaff(item.itemname, department ? department.name : 'Main Warehouse');
      }
    }
  } catch (error) {
    console.error('❌ Error during automatic restocking:', error);
  }
};
