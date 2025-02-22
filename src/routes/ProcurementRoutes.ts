import { Router, Response, RequestHandler } from 'express';
import { ProcurementRequest } from '../models/ProcurementRequest';
import { authenticateUser, AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { authorizeRole } from '../middlewares/RoleCheck';
import { notifyApprovalRequired } from '../services/NotificationService';

const router = Router();

// Define a type for the procurement request body
interface ProcurementRequestBody {
  title: string;
  description?: string;
  departmentId: number;
  priorityLevel: 'Low' | 'Medium' | 'High';
  deadlineDate: Date;
}

// Submit a new procurement request
router.post(
  '/',
  authenticateUser as unknown as RequestHandler,
  authorizeRole(['Staff', 'DeputyDirector', 'Director']) as unknown as RequestHandler,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { title, description, departmentId, priorityLevel, deadlineDate , quantity} = req.body;

      // Create a new procurement request
      const newRequest = await ProcurementRequest.create({
        title,
        description,
        departmentId,
        priorityLevel,
        deadlineDate,
        quantity,
        requestedBy: req.user!.id, // Non-null assertion for authenticated user ID
        status: 'Pending', // Default status for new requests
      });

      // Send a mock approval notification
      notifyApprovalRequired(newRequest.id, 'Director');

      res.status(201).json({
        message: 'Procurement request submitted successfully.',
        request: newRequest,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to submit procurement request.' });
    }
  }
);

// View all procurement requests (Admin, Director, DeputyDirector)
router.get(
  '/',
  authenticateUser as unknown as RequestHandler,
  authorizeRole(['Admin', 'Director', 'DeputyDirector']) as unknown as RequestHandler,
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const requests = await ProcurementRequest.findAll();
      res.status(200).json({ requests });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch procurement requests.' });
    }
  }
);

// Approve, reject, or return a procurement request
router.patch(
  '/:id/status',
  authenticateUser as unknown as RequestHandler,
  authorizeRole(['Director', 'DeputyDirector', 'Admin']) as unknown as RequestHandler,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const request = await ProcurementRequest.findByPk(id);
      if (!request) {
        res.status(404).json({ message: 'Procurement request not found.' });
        return;
      }

      request.status = status;
      await request.save();

      res.status(200).json({
        message: `Request status updated to ${status}.`,
        request,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to update procurement request status.' });
    }
  }
);

export default router;
