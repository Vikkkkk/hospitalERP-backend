import { InventoryRequest } from '../models/InventoryRequest';
import { Inventory } from '../models/Inventory';
import { InventoryBatch } from '../models/InventoryBatch';
import { InventoryService } from '../services/InventoryService';
import { RestockingService } from './RestockingService'; // ✅ Added RestockingService
import { Op } from 'sequelize';

export class InventoryRequestService {
  /**
   * 📩 Submit a new inventory request
   */
  static async createRequest(requestedBy: number, departmentId: number, itemName: string, quantity: number) {
    return await InventoryRequest.create({
      requestedBy,
      departmentId,
      itemName,
      quantity,
      status: 'Pending',
    });
  }

  /**
   * 🔍 Fetch all inventory requests
   */
  static async getInventoryRequests(status?: string) { // ✅ Fixed method name to match controller
    const whereClause = status ? { status } : {};
    return await InventoryRequest.findAll({ where: whereClause });
  }

  /**
   * ✅ Approve or Reject an Inventory Request
   */
  static async processRequest(requestId: number, status: 'Approved' | 'Rejected', approverId: number) {
    const request = await InventoryRequest.findByPk(requestId);
    if (!request) throw new Error('Request not found');
  
    if (status === 'Approved') {
      const inventoryItem = await Inventory.findOne({ where: { itemname: request.itemName, departmentId: null } });
  
      if (!inventoryItem) {
        throw new Error(`物资 ${request.itemName} 在主库存中不存在`);
      }
  
      // ✅ Check total stock in batches
      const totalStock = await InventoryBatch.sum('quantity', { where: { itemId: inventoryItem.id } });
  
      if (totalStock < request.quantity) {
        request.status = 'Restocking';
        await request.save();
        throw new Error(`库存不足 (仅剩 ${totalStock} 件)，需要补货`);
      }
  
      // ✅ Deduct stock from main inventory batches
      let remainingQuantity = request.quantity;
      const batches = await InventoryBatch.findAll({
        where: { itemId: inventoryItem.id },
        order: [['expiryDate', 'ASC']], // ✅ Always use closest expiry first
      });
  
      for (const batch of batches) {
        if (remainingQuantity <= 0) break;
        const deductAmount = Math.min(batch.quantity, remainingQuantity);
        batch.quantity -= deductAmount;
        remainingQuantity -= deductAmount;
        await batch.save();
      }
  
      // ✅ Find or create department inventory item
      let departmentItem = await Inventory.findOne({ where: { itemname: request.itemName, departmentId: request.departmentId } });
  
      if (!departmentItem) {
        departmentItem = await Inventory.create({
          itemname: request.itemName,
          category: inventoryItem.category,
          unit: inventoryItem.unit,
          minimumStockLevel: inventoryItem.minimumStockLevel,
          restockThreshold: inventoryItem.restockThreshold,
          departmentId: request.departmentId,
        });
      }
  
      // ✅ Allocate stock from existing batches instead of direct quantity update
      await InventoryService.allocateFromBatches(departmentItem.id, request.quantity);
  
      request.status = 'Approved';
      await request.save();
  
      // 🚨 If stock is low after approval, auto-create restocking request
      const newTotalStock = await InventoryBatch.sum('quantity', { where: { itemId: inventoryItem.id } });
      if (newTotalStock < inventoryItem.restockThreshold) {
        await RestockingService.createRestockingRequest(inventoryItem.id, inventoryItem.minimumStockLevel * 2, approverId);
      }
    } else {
      request.status = 'Rejected';
    }
  
    await request.save();
    return request;
  }

  /**
   * 🔄 Trigger Restocking Request
   */
  static async triggerRestocking(requestId: number, userId: number) {
    const request = await InventoryRequest.findByPk(requestId);
    if (!request) throw new Error('Request not found');

    request.status = 'Restocking';
    await request.save();

    await RestockingService.createRestockingRequest(request.id, request.quantity, userId);

    return request;
  }
}