import { InventoryRequest } from '../models/InventoryRequest';
import { Request, Response } from 'express';
import { InventoryRequestService } from '../services/InventoryRequestService';

export class InventoryRequestController {
  /**
   * 📩 Submit a new inventory request
   */
  static async createRequest(req: Request, res: Response): Promise<void> {
    try {
      const { itemName, quantity, departmentId } = req.body;
      const userId = (req.user as any)?.id;
      const request = await InventoryRequestService.createRequest(userId, departmentId, itemName, quantity);
      res.status(201).json({ message: 'Inventory request submitted successfully', request });
    } catch (error) {
      console.error('❌ Inventory request submission failed:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * 🔍 Get all inventory requests (Pending, Approved, Rejected, Restocking)
   */
  static async getAllRequests(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.query;
      const requests = await InventoryRequestService.getInventoryRequests(status as string);
      res.status(200).json({ requests });
    } catch (error) {
      console.error('❌ Failed to fetch inventory requests:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * ✅ Approve or Reject an Inventory Request
   */
  static async processRequest(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.body;
      if (!["Approved", "Rejected"].includes(status)) {
        res.status(400).json({ message: 'Invalid status value' });
        return;
      }

      const updatedRequest = await InventoryRequestService.processRequest(
        Number(req.params.id),
        status,
        (req.user as any)?.id
      );

      res.status(200).json({ message: `Request ${status.toLowerCase()}`, request: updatedRequest });
    } catch (error) {
      console.error('❌ Request processing failed:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * 🔄 Trigger Restocking Request
   */
  static async triggerRestocking(req: Request, res: Response): Promise<void> {
    try {
      const updatedRequest = await InventoryRequestService.triggerRestocking(
        Number(req.params.id),
        (req.user as any)?.id
      );
      res.status(200).json({ message: 'Restocking request triggered', request: updatedRequest });
    } catch (error) {
      console.error('❌ Restocking request failed:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  }
}