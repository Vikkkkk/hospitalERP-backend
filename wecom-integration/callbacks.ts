// wecom-integration/callbacks.ts

import { Request, Response } from 'express';
import { ProcurementRequest } from '../backend-api/src/models/ProcurementRequest';

// Handle approval/rejection callbacks from WeCom
export const handleApprovalCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId, approved } = req.body;

    const request = await ProcurementRequest.findByPk(requestId);
    if (!request) {
      res.status(404).json({ message: '未找到采购请求' });
      return;
    }

    request.status = approved ? 'Approved' : 'Rejected';
    await request.save();

    res.status(200).json({ message: `请求状态已更新为 ${approved ? '通过' : '驳回'}` });
  } catch (error) {
    console.error('❌ 处理审批回调失败:', error);
    res.status(500).json({ message: '无法处理审批回调' });
  }
};
