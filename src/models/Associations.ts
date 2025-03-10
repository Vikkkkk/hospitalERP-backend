// backend-api/src/models/Associations.ts
import { User } from './User';
import { Department } from './Department';
import { Inventory } from './Inventory';
import { InventoryTransaction } from './InventoryTransaction';

// Users belong to Departments
User.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
Department.hasMany(User, { foreignKey: 'departmentId', as: 'users' });

// Inventory belongs to Departments
Inventory.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
Department.hasMany(Inventory, { foreignKey: 'departmentId', as: 'inventory' });

// Inventory Transactions
InventoryTransaction.belongsTo(Inventory, { foreignKey: 'inventoryid', as: 'inventory' });
Inventory.hasMany(InventoryTransaction, { foreignKey: 'inventoryid', as: 'transactions' });

InventoryTransaction.belongsTo(User, { foreignKey: 'performedby', as: 'performedBy' });
User.hasMany(InventoryTransaction, { foreignKey: 'performedby', as: 'transactions' });
