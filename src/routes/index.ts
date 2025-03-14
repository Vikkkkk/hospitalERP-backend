import { Router } from 'express';
import procurementRoutes from './ProcurementRoutes';
import inventoryRoutes from './InventoryRoutes';
import userRoutes from './UserRoutes';
import departmentRoutes from './DepartmentRoutes';
import authRoutes from './AuthRoutes';
import weComAuthRoutes from './WeComAuthRoutes';
import weComCallbackRoutes from './WeComCallbackRoutes';
import { sequelize } from '../config/database';

const router = Router();

// ✅ Route definitions
router.use('/procurements', procurementRoutes);  
router.use('/inventory', inventoryRoutes);        
router.use('/users', userRoutes);                
router.use('/departments', departmentRoutes);      
router.use('/auth', authRoutes);                 
router.use('/wecom-auth', weComAuthRoutes);      
router.use('/wecom-callback', weComCallbackRoutes); 

// ✅ API Health Check (Improved)
router.get('/', async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ message: 'Hospital ERP API is running ✅', db: 'Connected' });
  } catch (error) {
    res.status(500).json({ message: 'API is running, but database connection failed ❌', error: (error as Error).message });
  }
});

export default router;
