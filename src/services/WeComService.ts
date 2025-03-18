// backend-api/src/services/WeComService.ts
import axios from 'axios';
import dotenv from 'dotenv';
import { LoggerService } from './LoggerService';
import { ProcurementRequest } from '../models/ProcurementRequest';

dotenv.config();

// ✅ Load environment variables
const corpId = process.env.WECOM_CORP_ID;
const corpSecret = process.env.WECOM_CORP_SECRET;
const agentId = process.env.WECOM_AGENT_ID;
const wecomWebhookURL = process.env.WECOM_WEBHOOK_URL; // ✅ Webhook for group messages

if (!corpId || !corpSecret || !agentId || !wecomWebhookURL) {
  throw new Error('🚨 Missing WeCom environment variables!');
}

let accessToken: string = '';
let tokenExpiry: number = 0; // ✅ Track expiry time

/**
 * 🔑 Fetch and cache the WeCom access token
 */
export const fetchAccessToken = async (): Promise<string> => {
  const currentTime = Math.floor(Date.now() / 1000);

  if (accessToken && tokenExpiry > currentTime) {
    return accessToken; // ✅ Reuse valid token
  }

  try {
    const response = await axios.get(
      `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpId}&corpsecret=${corpSecret}`
    );

    if (response.data.errcode !== 0) {
      throw new Error(`WeCom token fetch failed: ${response.data.errmsg}`);
    }

    accessToken = response.data.access_token;
    tokenExpiry = currentTime + response.data.expires_in - 300; // ✅ Set expiry buffer (5 min)

    LoggerService.info(`✅ WeCom Access Token updated, expires in: ${response.data.expires_in} seconds`);
    return accessToken;
  } catch (error) {
    LoggerService.error(`❌ Failed to fetch WeCom Access Token: ${(error as Error).message}`);
    throw new Error('无法获取 AccessToken');
  }
};

/**
 * 📩 Send a direct message to a user on WeCom
 */
export const sendWeComMessage = async (wecomUserId: string, message: string): Promise<boolean> => {
  try {
    const token = await fetchAccessToken();

    const payload = {
      touser: wecomUserId,
      msgtype: "text",
      agentid: agentId,
      text: { content: message },
      safe: 0,
    };

    const response = await axios.post(
      `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${token}`,
      payload
    );

    if (response.data.errcode !== 0) {
      throw new Error(`WeCom message send failed: ${response.data.errmsg}`);
    }

    LoggerService.info(`✅ WeCom Message Sent to ${wecomUserId}: ${message}`);
    return true;
  } catch (error) {
    LoggerService.error(`❌ Failed to send WeCom message: ${(error as Error).message}`);
    return false;
  }
};

/**
 * 📢 Send a notification to a WeCom Group using Webhook
 */
export const sendWeComGroupNotification = async (message: string): Promise<boolean> => {
  try {
    const payload = {
      msgtype: "text",
      text: { content: message },
    };

    const response = await axios.post(wecomWebhookURL, payload);

    if (response.data.errcode !== 0) {
      throw new Error(`Group notification failed: ${response.data.errmsg}`);
    }

    LoggerService.info(`✅ WeCom Group Notification Sent: ${message}`);
    return true;
  } catch (error) {
    LoggerService.error(`❌ Failed to send WeCom group notification: ${(error as Error).message}`);
    return false;
  }
};

/**
 * ✅ Retrieve WeCom User Information for Login
 */
export const getWeComUser = async (code: string): Promise<any> => {
  try {
    const token = await fetchAccessToken();

    if (!code) {
      throw new Error('❌ WeCom OAuth Code is missing!');
    }

    const response = await axios.get(
      `https://qyapi.weixin.qq.com/cgi-bin/user/getuserinfo?access_token=${token}&code=${code}`
    );

    if (response.data.errcode !== 0) {
      throw new Error(`获取用户信息失败: ${response.data.errmsg}`);
    }

    return response.data;
  } catch (error) {
    LoggerService.error(`❌ Failed to retrieve WeCom user info: ${(error as Error).message}`);
    throw new Error('无法获取用户信息');
  }
};

/**
 * 📩 Send an approval request to WeCom
 */
export const sendWeComApprovalRequest = async (request: any): Promise<string> => {
  try {
    const token = await fetchAccessToken();

    if (!request.id || !request.title || !request.description) {
      throw new Error('❌ Invalid approval request data!');
    }

    const approvers = request.approvers || ['DefaultManagerID']; // ✅ Replace with real approvers

    const payload = {
      agentid: agentId,
      approval_id: `APPROVAL-${request.id}`,
      content: `审批请求: ${request.title}\n描述: ${request.description}\n优先级: ${request.priorityLevel || '普通'}\n数量: ${request.quantity || 'N/A'}`,
      approvers,
    };

    const response = await axios.post(
      "https://qyapi.weixin.qq.com/cgi-bin/oa/applyevent",
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.errcode !== 0) {
      throw new Error(`审批请求失败: ${response.data.errmsg}`);
    }

    LoggerService.info(`✅ 审批请求已成功发送至企业微信 (ID: ${payload.approval_id})`);
    return payload.approval_id;
  } catch (error) {
    LoggerService.error(`❌ Failed to send WeCom approval request: ${(error as Error).message}`);
    throw new Error('无法发送审批请求');
  }
};

/**
 * ✅ Handle approval callback from WeCom
 */
export const handleWeComApprovalCallback = async (
  approvalId: string,
  status: string
): Promise<boolean> => {
  try {
    if (!approvalId || !status) {
      throw new Error('❌ Missing approval ID or status in callback.');
    }

    const procurementRequest = await ProcurementRequest.findOne({
      where: { approvalId },
    });

    if (!procurementRequest) {
      LoggerService.error(`❌ 未找到审批ID为 ${approvalId} 的采购请求`);
      return false;
    }

    const statusMapping: Record<string, 'Pending' | 'Approved' | 'Rejected' | 'Completed'> = {
      approved: 'Approved',
      rejected: 'Rejected',
      returned: 'Pending',
      completed: 'Completed',
    };

    const normalizedStatus = statusMapping[status.toLowerCase()] || 'Pending';
    procurementRequest.status = normalizedStatus;
    await procurementRequest.save();

    LoggerService.info(`✅ 审批ID: ${approvalId} 的请求状态已更新为 ${normalizedStatus}`);
    return true;
  } catch (error) {
    LoggerService.error(`❌ Failed to update approval status: ${(error as Error).message}`);
    return false;
  }
};

/**
 * ✅ Export updated functions
 */

/**
 * 🏷️ Notify 部长 that approval is required
 */
export const notifyApprovalRequired = async (requestId: number, role: string) => {
  const message = `🔔 采购审批请求\n请求 ID: ${requestId}\n审批人角色: ${role}\n请前往系统进行审批。`;
  await sendWeComGroupNotification(message);
};

/**
 * ✅ Notify 采购部 that a purchase request was approved
 */
export const notifyPurchaseApproval = async (requestId: number, title: string) => {
  const message = `✅ 采购请求已批准\n请求 ID: ${requestId}\n标题: ${title}\n请执行采购操作。`;
  await sendWeComGroupNotification(message);
};

/**
 * ❌ Notify requestor that a purchase request was rejected
 */
export const notifyPurchaseRejection = async (requestId: number, title: string) => {
  const message = `❌ 采购请求被拒绝\n请求 ID: ${requestId}\n标题: ${title}\n请联系相关人员。`;
  await sendWeComGroupNotification(message);
};

/**
 * 📦 Notify 后勤部职员 of a stock request
 */
export const notifyStockRequest = async (itemName: string, quantity: number, requester: string) => {
  const message = `📦 物资申请通知\n物品: ${itemName}\n数量: ${quantity}\n申请人: ${requester}`;
  await sendWeComGroupNotification(message);
};

/**
 * ✅ Notify a user that their stock request has been approved
 */
export const notifyStockApproval = async (wecomUserId: string, itemName: string, quantity: number) => {
  const message = `✅ 物资申请已批准\n物品: ${itemName}\n数量: ${quantity}\n请前往仓库领取。`;
  await sendWeComMessage(wecomUserId, message);
};

/**
 * 🚨 Notify 后勤部职员 of a low stock alert
 */
export const notifyLowStock = async (itemName: string, currentStock: number) => {
  const message = `⚠️ 库存低警告\n物品: ${itemName}\n当前库存: ${currentStock}\n请考虑补货。`;
  await sendWeComGroupNotification(message);
};

/**
 * 🛒 Notify 采购部 of a new purchase request
 */
export const notifyPurchaseRequest = async (itemName: string, quantity: number, requester: string) => {
  const message = `🛒 采购申请通知\n物品: ${itemName}\n数量: ${quantity}\n申请人: ${requester}`;
  await sendWeComGroupNotification(message);
};

