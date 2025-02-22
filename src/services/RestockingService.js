// backend-api/src/services/RestockingService.js

const { Inventory } = require('../models/Inventory');
const { ProcurementRequest } = require('../models/ProcurementRequest');
const { Department } = require('../models/Department');

// Function to check inventory levels and trigger restocking
const checkAndTriggerRestocking = async () => {
  try {
    // Find all items below minimum stock level
    const lowStockItems = await Inventory.findAll({
      where: {
        quantity: { $lt: sequelize.col('minimumStockLevel') },
      },
    });

    for (const item of lowStockItems) {
      // Check if a restocking request already exists for this item
      const existingRequest = await ProcurementRequest.findOne({
        where: {
          title: `Restock: ${item.itemName}`,
          status: 'Pending',
        },
      });

      if (!existingRequest) {
        // Create a new procurement request for restocking
        const department = item.departmentId
          ? await Department.findByPk(item.departmentId)
          : null;

        await ProcurementRequest.create({
          title: `Restock: ${item.itemName}`,
          description: `Automatically triggered restocking for ${item.itemName}.`,
          departmentId: item.departmentId || null,
          requestedBy: 1, // System-triggered, replace with appropriate system user ID
          priorityLevel: 'High',
          deadlineDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        });

        console.log(
          `📦 Restocking request created for item: ${item.itemName} (${department ? department.name : 'Main Warehouse'})`
        );
      }
    }
  } catch (error) {
    console.error('❌ Error in restocking logic:', error);
  }
};

// Set up periodic checks (e.g., every 1 hour)
setInterval(checkAndTriggerRestocking, 60 * 60 * 1000);

module.exports = {
  checkAndTriggerRestocking,
};
