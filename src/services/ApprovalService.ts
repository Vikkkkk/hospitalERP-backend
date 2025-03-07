// backend-api/src/services/ApprovalService.ts

import { ProcurementRequest } from '../models/ProcurementRequest';

export class ApprovalService {
  // ✅ Define valid status values
  static validStatuses: Record<string, 'Pending' | 'Approved' | 'Rejected' | 'Completed'> = {
    approved: 'Approved',
    rejected: 'Rejected',
    returned: 'Pending', // Returned requests go back to Pending for re-review
    completed: 'Completed',
  };

  /**
   * 🔄 Handle approval response from WeCom
   * - Updates the procurement request status based on approval outcome.
   */
  static async handleApprovalResponse(approvalId: string, status: string): Promise<{ success: boolean; message: string }> {
    try {
      const request = await ProcurementRequest.findOne({ where: { approvalId } });

      if (!request) {
        console.error(`❌ Procurement request with approval ID ${approvalId} not found.`);
        return { success: false, message: 'Procurement request not found' };
      }

      // ✅ Normalize status using the valid status mapping
      const normalizedStatus = this.validStatuses[status.toLowerCase()] || 'Pending';
      request.status = normalizedStatus;
      await request.save();

      console.log(`✅ Approval status updated for request ID ${approvalId}: ${normalizedStatus}`);
      return { success: true, message: `Status updated to ${normalizedStatus}` };
    } catch (error) {
      console.error(`❌ Error updating approval status for ID ${approvalId}:`, (error as Error).message);
      return { success: false, message: 'Error updating approval status' };
    }
  }
}





// 📝 Key Features & Functions:
// Handles approval responses from WeCom for procurement requests.
// Finds the corresponding procurement request using the approvalId.
// Updates the procurement request’s status based on the approval outcome.
// Logs errors if the request isn’t found or if something goes wrong.
// 🚀 Issues & Optimizations
// ✅ Potential Enhancements:

// Improve Status Mapping:

// Right now, the function only manually updates three statuses.
// We should ensure all possible statuses are handled properly.
// Use a Type for Status Values:

// Instead of plain strings, we should use a TypeScript type to define valid statuses.
// This ensures we don’t accidentally introduce an invalid status.
// Return a Response Instead of Just Logging:

// Right now, if the request isn’t found, it just logs an error.
// It should return a result so the caller can handle it properly.