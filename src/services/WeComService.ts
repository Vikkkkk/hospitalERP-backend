export const sendApprovalRequest = (userId: number, requestId: number, itemName: string, departmentName: string): void => {
  console.log(
    `📤 WeCom Notification: Approval request sent to user ID ${userId} for request ID ${requestId}. Item: ${itemName} Department: ${departmentName}`
  );
};

export const receiveApprovalResponse = (requestId: number, approved: boolean = true): string => {
  console.log(
    approved
      ? `✅ WeCom: Request ID ${requestId} has been approved.`
      : `❌ WeCom: Request ID ${requestId} has been rejected.`
  );
  return approved ? 'Approved' : 'Rejected';
};

export const sendRestockingNotification = (itemName: string, departmentName: string): void => {
  console.log(
    `📦 WeCom Notification: Restocking request generated for ${itemName} in ${departmentName}.`
  );
};
