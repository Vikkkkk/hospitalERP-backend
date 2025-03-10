import { Inventory } from '../models/Inventory';
import { Op } from 'sequelize';

export class InventoryService {
  /**
   * 🔍 Get paginated inventory list
   */
  static async getPaginatedInventory(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const inventoryItems = await Inventory.findAndCountAll({
      limit,
      offset,
    });

    return {
      inventory: inventoryItems.rows,
      totalItems: inventoryItems.count,
      totalPages: Math.ceil(inventoryItems.count / limit),
      currentPage: page,
    };
  }

  /**
   * 🔄 Transfer stock from the main warehouse to a department
   */
  static async transferStock(itemName: string, quantity: number, departmentId: number) {
    const warehouseItem = await Inventory.findOne({
      where: { itemname: itemName, departmentId: null },
    });

    if (!warehouseItem || warehouseItem.quantity < quantity) {
      throw new Error('仓库库存不足');
    }

    warehouseItem.quantity -= quantity;
    await warehouseItem.save();

    let departmentItem = await Inventory.findOne({
      where: { itemname: itemName, departmentId },
    });

    if (departmentItem) {
      departmentItem.quantity += quantity;
    } else {
      departmentItem = await Inventory.create({
        itemname: itemName,
        category: 'Medical Supply', // ✅ Ensure valid category
        unit: 'pcs', // ✅ Default unit
        quantity,
        minimumStockLevel: 10,
        restockThreshold: 5, // ✅ Default restock threshold
        departmentId,
      });
    }

    await departmentItem.save();
  }

  /**
   * ✏️ Update daily inventory usage
   */
  static async updateInventoryUsage(itemName: string, usedQuantity: number, departmentId: number) {
    const departmentItem = await Inventory.findOne({
      where: { itemname: itemName, departmentId },
    });

    if (!departmentItem || departmentItem.quantity < usedQuantity) {
      throw new Error('库存不足，无法更新');
    }

    departmentItem.quantity -= usedQuantity;
    await departmentItem.save();
  }
}
