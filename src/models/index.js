// backend-api/src/models/index.js

const { sequelize } = require('../config/database');
const User = require('./User');
const Department = require('./Department');
const ProcurementRequest = require('./ProcurementRequest');
const Inventory = require('./Inventory');

// Set up associations
User.belongsTo(Department, {
  foreignKey: 'departmentId',
  as: 'department',
});

Department.hasMany(User, {
  foreignKey: 'departmentId',
  as: 'users',
});

ProcurementRequest.belongsTo(User, {
  foreignKey: 'requestedBy',
  as: 'requester',
});

ProcurementRequest.belongsTo(Department, {
  foreignKey: 'departmentId',
  as: 'department',
});

Inventory.belongsTo(Department, {
  foreignKey: 'departmentId',
  as: 'department',
});

module.exports = {
  sequelize,
  User,
  Department,
  ProcurementRequest,
  Inventory,
};
