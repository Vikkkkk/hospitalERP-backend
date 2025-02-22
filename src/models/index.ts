import { sequelize } from '../config/database';
import { User } from './User';
import { Department } from './Department';
import { ProcurementRequest } from './ProcurementRequest';
import { Inventory } from './Inventory';

// Associations
User.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
Department.hasMany(User, { foreignKey: 'departmentId', as: 'users' });

ProcurementRequest.belongsTo(User, { foreignKey: 'requestedBy', as: 'requester' });
ProcurementRequest.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

Inventory.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

export {
  sequelize,
  User,
  Department,
  ProcurementRequest,
  Inventory,
};
