// backend-api/src/routes/InventoryRoutes.js

const express = require('express');
const router = express.Router();
const { Inventory } = require('../models/Inventory');
const { authorizeRole } = require('../middlewares/RoleCheck');
const { authenticateUser } = require('../middlewares/authMiddleware');

// View all inventory items (Admins, Directors, Warehouse Staff)
router.get(
  '/',
  authenticateUser,
  authorizeRole(['Admin', 'Director', 'DeputyDirector', 'WarehouseStaff']),
  async (req, res) => {
    try {
      const inventoryItems = await Inventory.findAll();
      res.status(200).json({ inventory: inventoryItems });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch inventory items.' });
    }
  }
);

// Transfer stock from the main warehouse to a department
router.post(
  '/transfer',
  authenticateUser,
  authorizeRole(['Admin', 'WarehouseStaff']),
  async (req, res) => {
    try {
      const { itemName, quantity, departmentId } = req.body;

      // Check if the item exists in the main warehouse
      const warehouseItem = await Inventory.findOne({
        where: { itemName, departmentId: null },
      });

      if (!warehouseItem || warehouseItem.quantity < quantity) {
        return res.status(400).json({ message: 'Insufficient stock in the warehouse.' });
      }

      // Deduct from the main warehouse
      warehouseItem.quantity -= quantity;
      await warehouseItem.save();

      // Add or update inventory in the department
      let departmentItem = await Inventory.findOne({
        where: { itemName, departmentId },
      });

      if (departmentItem) {
        departmentItem.quantity += quantity;
      } else {
        departmentItem = await Inventory.create({
          itemName,
          quantity,
          departmentId,
        });
      }

      await departmentItem.save();

      res.status(200).json({ message: 'Stock transferred successfully.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to transfer stock.' });
    }
  }
);

// Department staff updates their daily inventory usage
router.patch(
  '/update',
  authenticateUser,
  authorizeRole(['Staff', 'DeputyDirector', 'Director']),
  async (req, res) => {
    try {
      const { itemName, usedQuantity, departmentId } = req.body;

      // Find the item in the department’s inventory
      const departmentItem = await Inventory.findOne({
        where: { itemName, departmentId },
      });

      if (!departmentItem || departmentItem.quantity < usedQuantity) {
        return res.status(400).json({ message: 'Insufficient stock for usage update.' });
      }

      // Deduct used quantity
      departmentItem.quantity -= usedQuantity;
      await departmentItem.save();

      res.status(200).json({ message: 'Inventory updated successfully.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to update inventory usage.' });
    }
  }
);

module.exports = router;
