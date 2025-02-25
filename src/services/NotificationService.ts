// backend-api/src/services/NotificationService.ts

// 🛎️ Notify procurement staff about restocking requests
export const notifyProcurementStaff = (itemName: string, departmentName: string): void => {
  console.log(
    `🔔 [Restocking Request] A restocking request has been created for **${itemName}** in the **${departmentName}** department.`
  );
};

// ✅ Notify relevant users about approval requirements
export const notifyApprovalRequired = (requestId: number, approverRole: string): any => {
  console.log(
    `📥 [Approval Needed] Procurement request ID **${requestId}** requires approval from a user with the role: **${approverRole}**.`
  );
};

// 🔄 Notify users about procurement request status updates
export const notifyRequestStatusUpdate = (requestId: number, status: string): void => {
  console.log(
    `🔄 [Request Update] Procurement request ID **${requestId}** has been updated with status: **${status}**.`
  );
};

// 📢 General-purpose custom notification
export const sendCustomNotification = (message: string): void => {
  console.log(`📣 [Custom Notification] ${message}`);
};
