import { Request, Response } from 'express';
import { ProcurementRequest } from '../src/models/ProcurementRequest';

/**
 * ✅ Handle approval/rejection callbacks from WeCom
 */
export const handleApprovalCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId, status } = req.body; // ✅ Changed `approved` to `status`

    if (!requestId || !status) {
      res.status(400).json({ message: '缺少必要的参数' });
      return;
    }

    const request = await ProcurementRequest.findByPk(requestId);
    if (!request) {
      res.status(404).json({ message: '未找到采购请求' });
      return;
    }

    // ✅ Normalize the incoming status to match TypeScript enum
    const statusMapping: Record<string, 'Pending' | 'Approved' | 'Rejected' | 'Completed'> = {
      approved: 'Approved',
      rejected: 'Rejected',
      completed: 'Completed',
      returned: 'Pending', // Assuming "returned" means resubmitted
    };

    const normalizedStatus = statusMapping[status.toLowerCase()] || 'Pending';

    request.status = normalizedStatus;
    await request.save();

    res.status(200).json({ message: `请求状态已更新为 ${normalizedStatus}` });
  } catch (error) {
    const err = error as Error; // ✅ Proper error typecasting
    console.error('❌ 处理审批回调失败:', err.message);
    res.status(500).json({ message: '无法处理审批回调' });
  }
};
