// Mock notification for restocking requests
export const notifyProcurementStaff = (itemName: string, departmentName: string): void => {
  console.log(
    `🔔 Notification: Restocking request for ${itemName} created for department: ${departmentName}`
  );
};

// Mock notification for approvals
export const notifyApprovalRequired = (requestId: number, approverRole: string): void => {
  console.log(
    `📥 Approval Needed: Request ID ${requestId} requires approval from a user with the role: ${approverRole}`
  );
};

// Mock notification for status updates
export const notifyRequestStatusUpdate = (requestId: number, status: string): void => {
  console.log(`❌ Request ID ${requestId} has been marked as ${status}`);
};
