import { Router, Request, Response } from 'express';
import { ProcurementRequest } from '../models/ProcurementRequest';
import { authenticateUser, AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { authorizeAccess } from '../middlewares/AccessMiddleware';

const router = Router();

/**
 * 📌 TODO: Submit a Procurement Request
 * - Allow `二级库` to submit PRs when an item isn’t available in 一级库
 * - Auto-create PRs when restocking threshold is triggered
 */
router.post(
  '/',
  authenticateUser,
  async (_req: AuthenticatedRequest, res: Response): Promise<any> => {
    res.status(501).json({ message: '🚧 TODO: 采购申请提交功能尚未实现' });
  }
);

/**
 * 📋 TODO: View All Procurement Requests (For 采购部)
 */
router.get(
  '/',
  authenticateUser,
  authorizeAccess(['采购部', 'Admin']),
  async (_req: Request, res: Response) => {
    res.status(501).json({ message: '🚧 TODO: 获取所有采购请求' });
  }
);

/**
 * ✏️ TODO: Adjust & Submit Procurement Request (后勤部 Adjusts before submission)
 */
router.patch(
  '/:id/adjust',
  authenticateUser,
  authorizeAccess(['后勤部职员']),
  async (_req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({ message: '🚧 TODO: 采购申请数量调整功能尚未实现' });
  }
);

/**
 * 🔄 TODO: Approve or Reject Procurement Request (采购部)
 */
router.patch(
  '/:id/status',
  authenticateUser,
  authorizeAccess(['采购部']),
  async (_req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({ message: '🚧 TODO: 采购请求审批功能尚未实现' });
  }
);

/**
 * 🚚 TODO: Mark Procurement Request as Completed (采购部)
 */
router.patch(
  '/:id/complete',
  authenticateUser,
  authorizeAccess(['采购部']),
  async (_req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({ message: '🚧 TODO: 采购请求完成功能尚未实现' });
  }
);

export default router;