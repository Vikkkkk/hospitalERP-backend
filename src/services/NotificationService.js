// backend-api/src/services/NotificationService.js

// Mock notification for restocking requests
const notifyProcurementStaff = (itemName, departmentName) => {
    console.log(
      `🔔 Notification: Restocking request for ${itemName} has been created for the department: ${departmentName}.`
    );
  };
  
  // Mock notification for approvals
  const notifyApprovalRequired = (requestId, approverRole) => {
    console.log(
      `📥 Approval Needed: Request ID ${requestId} requires approval from a user with the role: ${approverRole}.`
    );
  };
  
  // Mock notification for rejected or returned requests
  const notifyRequestStatusUpdate = (requestId, status) => {
    console.log(
      `❌ Notification: Request ID ${requestId} has been marked as ${status}.`
    );
  };
  
  module.exports = {
    notifyProcurementStaff,
    notifyApprovalRequired,
    notifyRequestStatusUpdate,
  };
  