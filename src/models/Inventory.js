// backend-api/src/models/Inventory.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Inventory = sequelize.define('Inventory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  itemName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Null means it belongs to the main warehouse
  },
  minimumStockLevel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10, // Minimum level before triggering restocking
  },
  lastRestocked: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = Inventory;
