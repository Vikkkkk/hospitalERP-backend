const express = require('express');
const router = express.Router();

// Import individual route files
const procurementRoutes = require('./ProcurementRoutes');
const inventoryRoutes = require('./InventoryRoutes');

// Attach routes
router.use('/procurements', procurementRoutes);
router.use('/inventory', inventoryRoutes);

// Default health check route
router.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

module.exports = router;
