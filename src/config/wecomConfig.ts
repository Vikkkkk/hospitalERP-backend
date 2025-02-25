// backend-api/src/config/wecomConfig.ts

import dotenv from 'dotenv';

dotenv.config();

export const wecomConfig = {
  corpId: process.env.WECOM_CORP_ID || '',
  agentId: process.env.WECOM_AGENT_ID || '',
  secret: process.env.WECOM_SECRET || '',
  callbackUrl: process.env.WECOM_CALLBACK_URL || '',
};
