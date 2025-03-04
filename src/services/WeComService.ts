import axios from 'axios';
import dotenv from 'dotenv';
import { LoggerService } from './LoggerService';
import { ProcurementRequest } from '../models/ProcurementRequest';

dotenv.config();

const corpId = process.env.WECOM_CORP_ID!;
const corpSecret = process.env.WECOM_CORP_SECRET!;
const agentId = process.env.WECOM_AGENT_ID!;
let accessToken: string = '';
let tokenExpiry: number = 0; // ✅ Track expiry time

/**
 * 🔑 Fetch access token from WeCom
 */
const fetchAccessToken = async (): Promise<string> => {
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
    tokenExpiry = currentTime + response.data.expires_in - 60; // ✅ Set expiry buffer
    console.log(`🟢 Using Access Token: ${accessToken} (from fetchAccessToken)`);


    return accessToken;
  } catch (error) {
    LoggerService.error(`❌ 获取AccessToken失败: ${(error as Error).message}`);
    throw new Error('无法获取AccessToken');
  }
};

/**
 * 📩 Send an approval request to WeCom
 */
export const sendWeComApprovalRequest = async (request: any): Promise<string> => {
  try {
    const token = await fetchAccessToken();

    const approvers = request.approvers || ['DefaultManagerID']; // ✅ Replace with real approvers from request

    const payload = {
      agentid: agentId,
      approval_id: `APPROVAL-${request.id}`,
      content: `审批请求: ${request.title}\n描述: ${request.description}\n优先级: ${request.prioritylevel}\n数量: ${request.quantity}`,
      approvers: approvers,
    };

    console.log("📤 发送至 WeCom 的审批请求:", JSON.stringify(payload, null, 2));

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
    LoggerService.error(`❌ 发送审批请求失败: ${(error as Error).message}`);
    throw new Error('无法发送审批请求');
  }
};

/**
 * 🧑‍💻 Retrieve WeCom User Information for Login
 */
export const getWeComUser = async (code: string): Promise<any> => {
  try {
    const token = await fetchAccessToken();
    console.log(`🟡 WeCom OAuth Code Received: ${code} (from getWeComUser)`);
    console.log(`🟢 Using Access Token: ${token} (from getWeComUser)`);

    console.log("wecomserver.ts: token:",token,"code:",code);
    const response = await axios.get(
      `https://qyapi.weixin.qq.com/cgi-bin/user/getuserinfo?access_token=${token}&code=${code}`
    );

    if (response.data.errcode !== 0) {
      throw new Error(`获取用户信息失败: ${response.data.errmsg}`);
    }
    console.log(`📡 WeCom API Response:`, JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.log("wecomeService getwecomuser error!")
    LoggerService.error(`❌ 获取企业微信用户信息失败: ${(error as Error).message}`);
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
    LoggerService.error(`❌ 更新审批状态失败: ${(error as Error).message}`);
    return false;
  }
};
