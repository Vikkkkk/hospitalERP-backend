const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  globalRole: {
    type: DataTypes.ENUM('Admin', 'ExecutiveVicePresident', 'VicePresident', 'AssistantToPresident'),
    allowNull: true,
  },
  departmentRole: {
    type: DataTypes.ENUM('Director', 'DeputyDirector', 'Staff'),
    allowNull: true,
  },
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Departments',
      key: 'id',
    },
  },
});

module.exports = User;
