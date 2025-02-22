import { Router } from 'express';
import procurementRoutes from './ProcurementRoutes';
import inventoryRoutes from './InventoryRoutes';

const router = Router();

router.use('/procurements', procurementRoutes);
router.use('/inventory', inventoryRoutes);

router.get('/', (_req, res) => {
  res.json({ message: 'API is running' });
});

export default router;
