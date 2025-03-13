// backend-api/src/models/Associations.ts
import { User } from './User';
import { Department } from './Department';
import { Inventory } from './Inventory';
import { InventoryTransaction } from './InventoryTransaction';

// ✅ Users belong to Departments (Renamed alias)
User.belongsTo(Department, { foreignKey: 'departmentId', as: 'userDepartment' });
Department.hasMany(User, { foreignKey: 'departmentId', as: 'staff' });

// ✅ Inventory belongs to Departments (Renamed alias)
Inventory.belongsTo(Department, { foreignKey: 'departmentId', as: 'inventoryDepartment' });
Department.hasMany(Inventory, { foreignKey: 'departmentId', as: 'inventory' });

// ✅ Inventory Transactions
InventoryTransaction.belongsTo(Inventory, { foreignKey: 'inventoryid', as: 'inventory' });
Inventory.hasMany(InventoryTransaction, { foreignKey: 'inventoryid', as: 'transactions' });

InventoryTransaction.belongsTo(User, { foreignKey: 'performedby', as: 'performedBy' });
User.hasMany(InventoryTransaction, { foreignKey: 'performedby', as: 'transactions' });