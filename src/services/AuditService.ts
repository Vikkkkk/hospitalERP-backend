// backend-api/src/services/AuditService.ts
import { InventoryTransaction } from '../models/InventoryTransaction';
import { LoggerService } from './LoggerService';

type TransactionType = 'Transfer' | 'Usage' | 'Restocking' | 'Checkout';

interface AuditLogParams {
  itemname: string;
  category: string;
  performedby: number;
  departmentId: number | null;
  inventoryid: number;
  quantity: number;
  transactiontype: TransactionType;
  checkoutUser?: number; // ✅ Optional checkout user for QR/manual checkouts
}

// 📜 Logs inventory-related transactions (transfers, usage, restocking, checkout)
export const logTransaction = async ({
  itemname,
  category,
  performedby,
  departmentId,
  inventoryid,
  quantity,
  transactiontype,
  checkoutUser,
}: AuditLogParams): Promise<void> => {
  try {
    // ✅ Validate transaction type
    if (!['Transfer', 'Usage', 'Restocking', 'Checkout'].includes(transactiontype)) {
      throw new Error(`❌ Invalid transaction type: ${transactiontype}`);
    }

    if (!itemname || !category) {
      throw new Error(`❌ Missing itemname or category for transaction`);
    }

    await InventoryTransaction.create({
      itemname,
      category,
      performedby,
      departmentId,
      inventoryid,
      quantity,
      transactiontype,
      checkoutUser,
    });

    LoggerService.info(
      `✅ Transaction Logged | Type: ${transactiontype} | Item: ${itemname} (${category}) | Quantity: ${quantity} | By User ID: ${performedby} | Department: ${departmentId || 'Warehouse'}`
    );
  } catch (err) {
    const error = err as Error;

    LoggerService.error(
      `❌ Failed to log transaction: ${error.message} | Type: ${transactiontype} | Item: ${itemname} (${category}) | Quantity: ${quantity} | PerformedBy: ${performedby} | DepartmentId: ${departmentId || 'Warehouse'} | InventoryId: ${inventoryid}`
    );
  }
};