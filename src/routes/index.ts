import { Router } from 'express';
import procurementRoutes from './ProcurementRoutes';
import inventoryRoutes from './InventoryRoutes';
import userRoutes from './UserRoutes';
import departmentRoutes from './DepartmentRoutes';
import permissionRoutes from './PermissionRoutes';
import authRoutes from './AuthRoutes';

const router = Router();

// Route definitions
router.use('/procurements', procurementRoutes);  // 📦 Procurement requests
router.use('/inventory', inventoryRoutes);       // 📋 Inventory management
router.use('/users', userRoutes);                // 👥 User management
router.use('/departments', departmentRoutes);    // 🏢 Department management
router.use('/permissions', permissionRoutes);    // 🔒 Permissions management
router.use('/auth', authRoutes);                 // 🔑 Authentication

// Root route
router.get('/', (_req, res) => {
  res.json({ message: 'Hospital ERP API is running smoothly ✅' });
});

export default router;
