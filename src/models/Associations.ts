// backend-api/src/models/Associations.ts
import { User } from './User';
import { Department } from './Department';
import { Inventory } from './Inventory';
import { InventoryBatch } from './InventoryBatch';
import { InventoryTransaction } from './InventoryTransaction';
import { InventoryRequest } from './InventoryRequest';
import { ProcurementRequest } from './ProcurementRequest';
import { DepartmentPermissions } from './DepartmentPermissions';

// 🧑‍💼 Users ↔ Departments
User.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
Department.hasMany(User, { foreignKey: 'departmentId', as: 'users' });

// 📦 Inventory ↔ Departments
Inventory.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
Department.hasMany(Inventory, { foreignKey: 'departmentId', as: 'inventories' });

// 🗃️ Inventory ↔ Batches
Inventory.hasMany(InventoryBatch, { foreignKey: 'itemId', as: 'batches' });
InventoryBatch.belongsTo(Inventory, { foreignKey: 'itemId', as: 'inventoryItem' }); // Changed alias from 'inventory'

// 🔄 Inventory ↔ Transactions
Inventory.hasMany(InventoryTransaction, { foreignKey: 'inventoryid', as: 'transactions' });
InventoryTransaction.belongsTo(Inventory, { foreignKey: 'inventoryid', as: 'inventoryItem' }); // Changed alias

// 👤 Transactions ↔ Users
InventoryTransaction.belongsTo(User, { foreignKey: 'performedby', as: 'performedByUser' });
User.hasMany(InventoryTransaction, { foreignKey: 'performedby', as: 'performedTransactions' });

// ✅ Checkout User (WeCom)
InventoryTransaction.belongsTo(User, { foreignKey: 'checkoutUser', as: 'checkoutUserInfo' });
User.hasMany(InventoryTransaction, { foreignKey: 'checkoutUser', as: 'checkouts' });

// 📝 Transactions ↔ Department
InventoryTransaction.belongsTo(Department, { foreignKey: 'departmentId', as: 'transactionDepartment' });

// 📥 Inventory Requests ↔ User & Dept
InventoryRequest.belongsTo(User, { foreignKey: 'requestedBy', as: 'requester' });
User.hasMany(InventoryRequest, { foreignKey: 'requestedBy', as: 'inventoryRequests' });

InventoryRequest.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
Department.hasMany(InventoryRequest, { foreignKey: 'departmentId', as: 'inventoryRequests' });

InventoryRequest.belongsTo(Inventory, { foreignKey: 'itemName', targetKey: 'itemname', as: 'inventoryItem' });
Inventory.hasMany(InventoryRequest, { foreignKey: 'itemName', sourceKey: 'itemname', as: 'requests' });

// 🛒 Procurement Requests
ProcurementRequest.belongsTo(User, { foreignKey: 'requestedBy', as: 'requester' });
User.hasMany(ProcurementRequest, { foreignKey: 'requestedBy', as: 'procurementRequests' });

ProcurementRequest.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
Department.hasMany(ProcurementRequest, { foreignKey: 'departmentId', as: 'procurementRequests' });

// 🧩 Procurement ↔ Inventory (Auto-Restock)
ProcurementRequest.belongsTo(Inventory, { foreignKey: 'title', targetKey: 'itemname', as: 'inventoryItem' });
Inventory.hasMany(ProcurementRequest, { foreignKey: 'title', sourceKey: 'itemname', as: 'procurementRequests' });

// 🛂 Department Permissions
DepartmentPermissions.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
Department.hasMany(DepartmentPermissions, { foreignKey: 'departmentId', as: 'permissions' });

console.log("✅ Associations initialized once!");

export {
  User,
  Department,
  Inventory,
  InventoryBatch,
  InventoryTransaction,
  InventoryRequest,
  ProcurementRequest,
  DepartmentPermissions,
};