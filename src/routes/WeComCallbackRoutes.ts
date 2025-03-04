import { Router, Request, Response } from 'express';
import WechatCrypto from 'wechat-crypto';
import dotenv from 'dotenv';
import { handleWeComApprovalCallback } from '../services/WeComService';

dotenv.config();

const WECOM_TOKEN = process.env.WECOM_TOKEN!;
const WECOM_ENCODING_AES_KEY = process.env.WECOM_ENCODING_AES_KEY!;
const WECOM_CORP_ID = process.env.WECOM_CORP_ID!;

// ✅ Ensure all environment variables are loaded correctly
if (!WECOM_TOKEN || !WECOM_ENCODING_AES_KEY || !WECOM_CORP_ID) {
  throw new Error('Missing WeCom API credentials in .env');
}

// ✅ Initialize WeChat Crypto
const wechatCrypto = new WechatCrypto(WECOM_TOKEN, WECOM_ENCODING_AES_KEY, WECOM_CORP_ID);

const router = Router();

/**
 * 🛠 WeCom Webhook Verification (GET request)
 * ✅ WeCom sends this to verify our server.
 */
router.get('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📥 Received WeCom Webhook Verification Request:', req.query);

    const { msg_signature, timestamp, nonce, echostr } = req.query;

    if (!msg_signature || !timestamp || !nonce || !echostr) {
      res.status(400).json({ message: 'Missing required parameters' });
      return;
    }

    // ✅ Decrypt echostr from WeCom to verify the server
    const decrypted = wechatCrypto.decrypt(echostr as string);
    console.log('🔹 Decrypted echostr:', decrypted.message);

    res.status(200).send(decrypted.message);
  } catch (error) {
    console.error('❌ WeCom Webhook Verification Failed:', error);
    res.status(500).json({ message: 'Failed to verify WeCom webhook' });
  }
});

/**
 * 🔄 Handle WeCom approval callback (Webhook)
 * ✅ WeCom sends procurement approval updates here.
 */
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔹 WeCom Webhook Received:', req.body);

    const { approvalId, status } = req.body;

    if (!approvalId || !status) {
      res.status(400).json({ message: 'Invalid callback data' });
      return;
    }

    // ✅ Process approval callback
    const result = await handleWeComApprovalCallback(approvalId, status);

    if (!result) {
      res.status(404).json({ message: 'Approval request not found' });
      return;
    }

    res.status(200).json({ message: 'Approval status updated successfully' });
  } catch (error) {
    console.error('❌ WeCom Webhook Processing Failed:', error);
    res.status(500).json({ message: 'Failed to process WeCom callback' });
  }
});

export default router;
