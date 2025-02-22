import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { Inventory } from '../models/Inventory';
import { authenticateUser, AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { authorizeRole } from '../middlewares/RoleCheck';

interface InventoryTransferRequest {
  itemName: string;
  quantity: number;
  departmentId: number;
}

interface InventoryUsageUpdateRequest {
  itemName: string;
  usedQuantity: number;
  departmentId: number;
}

const router = Router();

// View all inventory items
router.get(
  '/',
  authenticateUser as unknown as RequestHandler, // Force-cast to match TypeScript expectations
  authorizeRole(['Admin', 'Director', 'DeputyDirector', 'WarehouseStaff']) as unknown as RequestHandler,
  async (_req: Request, res: Response) => {
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
  authenticateUser as unknown as RequestHandler,
  authorizeRole(['Admin', 'WarehouseStaff']) as unknown as RequestHandler,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { itemName, quantity, departmentId } = req.body;

      const warehouseItem = await Inventory.findOne({
        where: { itemName, departmentId: null },
      });

      if (!warehouseItem || warehouseItem.quantity < quantity) {
        res.status(400).json({ message: 'Insufficient stock in the warehouse.' });
        return;
      }

      warehouseItem.quantity -= quantity;
      await warehouseItem.save();

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
          minimumStockLevel: 10,
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

// Update daily inventory usage
router.patch(
  '/update',
  authenticateUser as unknown as RequestHandler,
  authorizeRole(['Staff', 'DeputyDirector', 'Director']) as unknown as RequestHandler,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { itemName, usedQuantity, departmentId } = req.body;

      const departmentItem = await Inventory.findOne({
        where: { itemName, departmentId },
      });

      if (!departmentItem || departmentItem.quantity < usedQuantity) {
        res.status(400).json({ message: 'Insufficient stock for usage update.' });
        return;
      }

      departmentItem.quantity -= usedQuantity;
      await departmentItem.save();

      res.status(200).json({ message: 'Inventory updated successfully.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to update inventory usage.' });
    }
  }
);

export default router;
