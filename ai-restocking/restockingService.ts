
// ai-restocking/restockingService.ts

import { Inventory } from '../backend-api/src/models/Inventory';
import { ProcurementRequest } from '../backend-api/src/models/ProcurementRequest';
import { Department } from '../backend-api/src/models/Department';
import { notifyProcurementStaff } from '../backend-api/src/services/NotificationService';
import { Op } from 'sequelize';

// Automatically triggers restocking requests for low-stock items
export const checkAndTriggerRestocking = async (): Promise<void> => {
  try {
    const lowStockItems = await Inventory.findAll({
      where: {
        quantity: {
          [Op.lt]: Inventory.sequelize!.col('minimumStockLevel'),
        },
      },
    });

    for (const item of lowStockItems) {
      // Prevent duplicate requests for the same item
      const existingRequest = await ProcurementRequest.findOne({
        where: {
          title: `Restock: ${item.itemName}`,
          status: 'Pending',
        },
      });

      if (!existingRequest) {
        const department = item.departmentId
          ? await Department.findByPk(item.departmentId)
          : null;

        // Create procurement request
        await ProcurementRequest.create({
          title: `Restock: ${item.itemName}`,
          description: `Automatically triggered restocking for ${item.itemName}`,
          departmentId: item.departmentId ?? null,
          requestedBy: 1, // System user ID
          priorityLevel: 'High',
          deadlineDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Deadline in 3 days
          quantity: item.minimumStockLevel - item.quantity,
          status: 'Pending',
        });

        notifyProcurementStaff(item.itemName, department ? department.name : 'Main Warehouse');
      }
    }
  } catch (error) {
    console.error('❌ 自动补货过程出错:', error);
  }
};
