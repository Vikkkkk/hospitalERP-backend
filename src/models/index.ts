import { sequelize } from '../config/database';
import { User } from './User';
import { Department } from './Department';
import { ProcurementRequest } from './ProcurementRequest';
import { Inventory } from './Inventory';

export {
  sequelize,
  User,
  Department,
  ProcurementRequest,
  Inventory,
};