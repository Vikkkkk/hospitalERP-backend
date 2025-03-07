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

if (!corpId || !corpSecret || !agentId) {
  throw new Error('🚨 Missing WeCom environment variables!');
}

let accessToken: string = '';
let tokenExpiry: number = 0; // ✅ Track expiry time

/**
 * 🔑 Fetch and cache the WeCom access token
 */
const fetchAccessToken = async (): Promise<string> => {
  const currentTime = Math.floor(Date.now() / 1000);

  if (accessToken && tokenExpiry > currentTime) {
    return accessToken; // ✅ Reuse valid token
  }

  try {
    console.log('🔄 Fetching new WeCom Access Token...');
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
      content: `审批请求: ${request.title}\n描述: ${request.description}\n优先级: ${request.prioritylevel || '普通'}\n数量: ${request.quantity || 'N/A'}`,
      approvers,
    };

    console.log("📤 Sending approval request to WeCom:", JSON.stringify(payload, null, 2));

    const response = await axios.post(
      "https://qyapi.weixin.qq.com/cgi-bin/oa/applyevent",
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
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
 * 🧑‍💻 Retrieve WeCom User Information for Login
 */
export const getWeComUser = async (code: string): Promise<any> => {
  try {
    const token = await fetchAccessToken();
    console.log(`🟡 WeCom OAuth Code Received: ${code}`);
    console.log(`🟢 Using Access Token: ${token}`);

    if (!code) {
      throw new Error('❌ WeCom OAuth Code is missing!');
    }

    const response = await axios.get(
      `https://qyapi.weixin.qq.com/cgi-bin/user/getuserinfo?access_token=${token}&code=${code}`
    );

    if (response.data.errcode !== 0) {
      throw new Error(`获取用户信息失败: ${response.data.errmsg}`);
    }

    console.log(`📡 WeCom API Response:`, JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    LoggerService.error(`❌ Failed to retrieve WeCom user info: ${(error as Error).message}`);
    throw new Error('无法获取用户信息');
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

    // ✅ Improved status mapping
    const statusMapping: Record<string, 'Pending' | 'Approved' | 'Rejected' | 'Completed'> = {
      approved: 'Approved',
      rejected: 'Rejected',
      returned: 'Pending', // Assuming "returned" means resubmitted
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
