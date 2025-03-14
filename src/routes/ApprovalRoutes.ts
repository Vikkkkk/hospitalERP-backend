import { Router, Request, Response } from 'express';
import { ProcurementRequest } from '../models/ProcurementRequest';
import { authenticateUser, AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { authorizeAccess } from '../middlewares/AccessMiddleware';
import { sendWeComApprovalRequest, handleWeComApprovalCallback } from '../services/WeComService';


const router = Router();

/**
 * 🔗 Submit an approval request through WeCom
 */
router.post(
  '/request',
  authenticateUser,
  authorizeAccess(['职员', '副部长', '部长']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { requestId } = req.body;

      // Find the procurement request in the database
      const procurementRequest = await ProcurementRequest.findByPk(requestId);

      if (!procurementRequest) {
        res.status(404).json({ message: '采购请求未找到' });
        return;
      }

      // Send approval request to WeCom
      const approvalId = await sendWeComApprovalRequest(procurementRequest);

      // Save approval ID to track responses later
      procurementRequest.approvalId = approvalId;
      await procurementRequest.save();

      res.status(200).json({
        message: '审批请求已发送至企业微信',
        approvalId,
      });
    } catch (error) {
      console.error('❌ 审批请求发送失败:', error);
      res.status(500).json({ message: '无法发送审批请求' });
    }
  }
);

/**
 * 🔄 Handle WeCom approval callback (Webhook)
 */
router.post('/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { approvalId, status } = req.body;

    if (!approvalId || !status) {
      res.status(400).json({ message: '无效的回调数据' });
      return;
    }

    // Update the status of the corresponding procurement request
    const result = await handleWeComApprovalCallback(approvalId, status);

    if (!result) {
      res.status(404).json({ message: '未找到相关的审批请求' });
      return;
    }

    res.status(200).json({ message: '审批状态已成功更新' });
  } catch (error) {
    console.error('❌ 审批回调处理失败:', error);
    res.status(500).json({ message: '处理回调失败' });
  }
});

export default router;
