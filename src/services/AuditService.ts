import { InventoryTransaction } from '../models/InventoryTransaction';
import { LoggerService } from './LoggerService';

type TransactionType = 'Transfer' | 'Usage' | 'Restocking';

interface AuditLogParams {
  itemname: string;
  category: string;
  performedby: number;
  departmentId: number | null;
  inventoryid: number;
  quantity: number;
  transactiontype: TransactionType;
}

// 📜 Logs inventory-related transactions (transfers, usage, restocking)
export const logTransaction = async ({
  itemname,
  category,
  performedby,
  departmentId,
  inventoryid,
  quantity,
  transactiontype,
}: AuditLogParams): Promise<void> => {
  try {
    // ✅ Validate transaction type
    if (!['Transfer', 'Usage', 'Restocking'].includes(transactiontype)) {
      throw new Error(`❌ Invalid transaction type: ${transactiontype}`);
    }

    // ✅ Ensure itemname & category are valid
    if (!itemname || !category) {
      throw new Error(`❌ Missing itemname or category for transaction`);
    }

    // ✅ Create inventory transaction entry
    await InventoryTransaction.create({
      itemname,
      category,
      performedby,
      departmentId,
      inventoryid,
      quantity,
      transactiontype,
    });

    // ✅ Improved success logging with details
    LoggerService.info(
      `✅ Transaction Logged | Type: ${transactiontype} | Item: ${itemname} (${category}) | Quantity: ${quantity} | By User ID: ${performedby} | Department: ${departmentId || 'Warehouse'}`
    );
  } catch (err) {
    const error = err as Error; // Explicitly cast error type

    // ✅ Improved error logging with more details
    LoggerService.error(
      `❌ Failed to log transaction: ${error.message} | Type: ${transactiontype} | Item: ${itemname} (${category}) | Quantity: ${quantity} | PerformedBy: ${performedby} | DepartmentId: ${departmentId || 'Warehouse'} | InventoryId: ${inventoryid}`
    );
  }
};
