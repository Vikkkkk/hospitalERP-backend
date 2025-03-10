// wecom-integration/wecomService.ts

import axios from 'axios';
import { wecomConfig } from '../src/config/wecomConfig';

const { corpId, agentId, secret } = wecomConfig;

// Fetch WeCom access token
const getAccessToken = async (): Promise<string | null> => {
  try {
    const response = await axios.get(
      `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpId}&corpsecret=${secret}`
    );

    return response.data.access_token;
  } catch (error) {
    console.error('❌ 无法获取WeCom访问令牌:', error);
    return null;
  }
};

// Send approval request to a user
export const sendApprovalRequest = async (
  userId: string,
  requestId: number,
  itemName: string,
  departmentName: string
): Promise<void> => {
  try {
    const token = await getAccessToken();
    if (!token) throw new Error('未能获取有效的WeCom访问令牌');

    const message = {
      touser: userId,
      msgtype: 'text',
      agentid: agentId,
      text: {
        content: `📢 新的采购请求待审批:
- 项目: ${itemName}
- 部门: ${departmentName}
- 请求编号: ${requestId}`,
      },
      safe: 0,
    };

    await axios.post(
      `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${token}`,
      message
    );

    console.log(`✅ 已发送审批请求给用户: ${userId}`);
  } catch (error) {
    console.error('❌ 发送审批请求失败:', error);
  }
};

// Send restocking notification
export const sendRestockingNotification = async (
  itemName: string,
  departmentName: string
): Promise<void> => {
  try {
    const token = await getAccessToken();
    if (!token) throw new Error('未能获取有效的WeCom访问令牌');

    const message = {
      touser: '@all',
      msgtype: 'text',
      agentid: agentId,
      text: {
        content: `🔔 自动补货提醒:
- 项目: ${itemName}
- 部门: ${departmentName}`,
      },
      safe: 0,
    };

    await axios.post(
      `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${token}`,
      message
    );

    console.log(`✅ 补货通知已发送`);
  } catch (error) {
    console.error('❌ 发送补货通知失败:', error);
  }
};
