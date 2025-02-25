// backend-api/src/services/ApprovalService.ts

import { ProcurementRequest } from '../models/ProcurementRequest';

export class ApprovalService {
  // 🔄 Handle approval response from WeCom
  static async handleApprovalResponse(approvalId: string, status: string): Promise<void> {
    try {
      const request = await ProcurementRequest.findOne({
        where: { approvalId },
      });

      if (!request) {
        console.error(`❌ Procurement request with approval ID ${approvalId} not found.`);
        return;
      }

      // Update request status
      if (status === 'approved') {
        request.status = 'Approved';
      } else if (status === 'rejected') {
        request.status = 'Rejected';
      } else if (status === 'returned') {
        request.status = 'Completed';
      }

      await request.save();
      console.log(`✅ Approval status updated for request ID ${approvalId}: ${status}`);
    } catch (error) {
      console.error(`❌ Error updating approval status for ID ${approvalId}:`, error);
    }
  }
}
