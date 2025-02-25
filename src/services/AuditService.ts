import { InventoryTransaction } from '../models/InventoryTransaction';
import { LoggerService } from './LoggerService';

type TransactionType = 'Transfer' | 'Usage' | 'Restocking';

interface AuditLogParams {
  performedby: number;
  departmentid: number | null;
  inventoryid: number;
  quantity: number;
  transactiontype: TransactionType;
}

// 📜 Logs inventory-related transactions (transfers, usage, restocking)
export const logTransaction = async ({
  performedby,
  departmentid,
  inventoryid,
  quantity,
  transactiontype,
}: AuditLogParams): Promise<void> => {
  try {
    if (!['Transfer', 'Usage', 'Restocking'].includes(transactiontype)) {
      throw new Error(`Invalid transaction type: ${transactiontype}`);
    }

    await InventoryTransaction.create({
      performedby,
      departmentid,
      inventoryid,
      quantity,
      transactiontype, // Strictly enforced to match valid types
    });

    LoggerService.info(
      `Transaction logged: ${transactiontype} by User ID ${performedby}`
    );
  } catch (err) {
    const error = err as Error; // ✅ Explicitly cast to Error type

    // ✅ Simplified the error logging for one argument support
    LoggerService.error(
      `❌ Failed to log transaction: ${error.message} | Details: PerformedBy=${performedby}, DepartmentId=${departmentid}, InventoryId=${inventoryid}, Quantity=${quantity}, Type=${transactiontype}`
    );
  }
};
