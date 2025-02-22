// backend-api/src/services/WeComService.js

// Mock function to simulate sending an approval request
const sendApprovalRequest = (userId, requestId, itemName, departmentName) => {
    console.log(
      `📤 WeCom Notification: Approval request sent to user ID ${userId} for request ID ${requestId}.\nItem: ${itemName}\nDepartment: ${departmentName}`
    );
  };
  
  // Mock function to simulate receiving approval response
  const receiveApprovalResponse = (requestId, approved = true) => {
    console.log(
      approved
        ? `✅ WeCom: Request ID ${requestId} has been approved.`
        : `❌ WeCom: Request ID ${requestId} has been rejected.`
    );
    return approved ? 'Approved' : 'Rejected';
  };
  
  // Mock function to simulate sending restocking notification
  const sendRestockingNotification = (itemName, departmentName) => {
    console.log(
      `📦 WeCom Notification: Restocking request generated for ${itemName} in ${departmentName}.`
    );
  };
  
  module.exports = {
    sendApprovalRequest,
    receiveApprovalResponse,
    sendRestockingNotification,
  };
  