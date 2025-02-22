import { Op } from 'sequelize';
import { Inventory } from '../models/Inventory';
import { ProcurementRequest } from '../models/ProcurementRequest';
import { Department } from '../models/Department';
import { notifyProcurementStaff } from './NotificationService';

// Function to automatically trigger restocking
export const checkAndTriggerRestocking = async (): Promise<void> => {
  try {
    const lowStockItems = await Inventory.findAll({
      where: {
        quantity: { [Op.lt]: 10 },
      },
    });

    for (const item of lowStockItems) {
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

        await ProcurementRequest.create({
          title: `Restock: ${item.itemName}`,
          description: `Automatically triggered restocking for ${item.itemName}.`,
          departmentId: item.departmentId ?? null,
          requestedBy: 1, // System user ID placeholder
          priorityLevel: 'High',
          deadlineDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
          status: 'Pending', // Explicitly setting the status
        });

        notifyProcurementStaff(item.itemName, department ? department.name : 'Main Warehouse');
      }
    }
  } catch (error) {
    console.error('❌ Error during restocking:', error);
  }
};

// Schedule checks every hour
setInterval(checkAndTriggerRestocking, 60 * 60 * 1000);
