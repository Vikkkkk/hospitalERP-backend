import axios from 'axios';
import dotenv from 'dotenv';
import { LoggerService } from './LoggerService';
import { ProcurementRequest } from '../models/ProcurementRequest';

dotenv.config();

const corpId = process.env.WECOM_CORP_ID!;
const corpSecret = process.env.WECOM_CORP_SECRET!;
const agentId = process.env.WECOM_AGENT_ID!;
let accessToken: string = ''; // Ensures type consistency

/**
 * 🔑 Fetch access token from WeCom
 */
const fetchAccessToken = async (): Promise<string> => {
  if (accessToken) return accessToken;

  try {
    const response = await axios.get(
      `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpId}&corpsecret=${corpSecret}`
    );

    if (response.data.errcode !== 0) {
      throw new Error(`WeCom token fetch failed: ${response.data.errmsg}`);
    }

    accessToken = response.data.access_token;
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

    const payload = {
      agentid: agentId,
      approval_id: `APPROVAL-${request.id}`,
      content: `审批请求: ${request.title}\n描述: ${request.description}\n优先级: ${request.prioritylevel}\n数量: ${request.quantity}`,
      approvers: ['ManagerID', 'DirectorID'], // Replace with real WeCom user IDs
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

    LoggerService.info('✅ 审批请求已成功发送至企业微信');
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
    const response = await axios.get(
      `https://qyapi.weixin.qq.com/cgi-bin/user/getuserinfo?access_token=${token}&code=${code}`
    );

    if (response.data.errcode !== 0) {
      throw new Error(`获取用户信息失败: ${response.data.errmsg}`);
    }

    return response.data;
  } catch (error) {
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

    // ✅ Normalize the incoming status to match the TypeScript enum
    let normalizedStatus: 'Pending' | 'Approved' | 'Rejected' | 'Completed';

    switch (status.toLowerCase()) {
      case 'approved':
        normalizedStatus = 'Approved';
        break;
      case 'rejected':
        normalizedStatus = 'Rejected';
        break;
      case 'returned':
        normalizedStatus = 'Pending'; // Assuming returned means resubmitted for approval
        break;
      case 'completed':
        normalizedStatus = 'Completed';
        break;
      default:
        normalizedStatus = 'Pending';
        break;
    }

    procurementRequest.status = normalizedStatus;
    await procurementRequest.save();

    LoggerService.info(`✅ 审批ID: ${approvalId} 的请求状态已更新为 ${status}`);
    return true;
  } catch (error) {
    LoggerService.error(`❌ 更新审批状态失败: ${(error as Error).message}`);
    return false;
  }
};
