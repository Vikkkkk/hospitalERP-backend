const User = require('./User');
const Department = require('./Department');
const ProcurementRequest = require('./ProcurementRequest');

// Associations

// User belongs to a Department
User.belongsTo(Department, {
  foreignKey: 'departmentId',
  as: 'department',
});

// Department has many Users
Department.hasMany(User, {
  foreignKey: 'departmentId',
  as: 'users',
});

// Procurement Requests belong to a User (submitted by)
ProcurementRequest.belongsTo(User, {
  foreignKey: 'requestedBy',
  as: 'requester',
});

// Procurement Requests belong to a Department
ProcurementRequest.belongsTo(Department, {
  foreignKey: 'departmentId',
  as: 'department',
});

module.exports = {
  User,
  Department,
  ProcurementRequest,
};
