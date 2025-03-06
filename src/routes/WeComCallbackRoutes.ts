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
  throw new Error('🚨 Missing WeCom API credentials in .env');
}

// ✅ Initialize WeChat Crypto
const wechatCrypto = new WechatCrypto(WECOM_TOKEN, WECOM_ENCODING_AES_KEY, WECOM_CORP_ID);

const router = Router();

/**
 * 🛠 WeCom Webhook Verification (GET request)
 * ✅ WeCom sends this to verify our server.
 */
router.get('/webhook', async (req: Request, res: Response): Promise<any> => {
  try {
    console.log('📥 Received WeCom Webhook Verification Request:', req.query);

    const { msg_signature, timestamp, nonce, echostr } = req.query;

    if (!msg_signature || !timestamp || !nonce || !echostr) {
      console.error('❌ Invalid verification request:', req.query);
      return res.status(400).json({ message: 'Missing required parameters' });
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
router.post('/webhook', async (req: Request, res: Response): Promise<any> => {
  try {
    console.log('📩 WeCom Webhook Received:', JSON.stringify(req.body, null, 2));

    const { msg_signature, timestamp, nonce } = req.query;
    const encryptedMessage = req.body?.xml?.Encrypt;

    if (!msg_signature || !timestamp || !nonce || !encryptedMessage) {
      console.error('❌ Invalid webhook request:', req.body);
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    // ✅ Decrypt incoming WeCom message
    const decryptedMessage = wechatCrypto.decrypt(encryptedMessage);
    console.log('🔓 Decrypted Webhook Message:', decryptedMessage.message);

    // ✅ Extract approval ID & status from decrypted XML
    const { approvalId, status } = parseWeComXml(decryptedMessage.message);

    if (!approvalId || !status) {
      console.error('❌ Invalid approval callback data:', decryptedMessage.message);
      return res.status(400).json({ message: 'Invalid callback data' });
    }

    // ✅ Process approval callback
    const result = await handleWeComApprovalCallback(approvalId, status);

    if (!result) {
      console.warn(`⚠️ Approval ID not found: ${approvalId}`);
      return res.status(404).json({ message: 'Approval request not found' });
    }

    console.log(`✅ Approval status updated: ${approvalId} → ${status}`);
    res.status(200).json({ message: 'Approval status updated successfully' });
  } catch (error) {
    console.error('❌ WeCom Webhook Processing Failed:', error);
    res.status(500).json({ message: 'Failed to process WeCom callback' });
  }
});

/**
 * 📦 Helper Function: Parse WeCom XML Data
 * ✅ Extracts `approvalId` and `status` from decrypted XML response.
 */
function parseWeComXml(xmlString: string): { approvalId?: string; status?: string } {
  try {
    // Parse XML manually (or use an XML parser library)
    const approvalIdMatch = xmlString.match(/<ApprovalId>(.*?)<\/ApprovalId>/);
    const statusMatch = xmlString.match(/<Status>(.*?)<\/Status>/);

    return {
      approvalId: approvalIdMatch ? approvalIdMatch[1] : undefined,
      status: statusMatch ? statusMatch[1] : undefined,
    };
  } catch (error) {
    console.error('❌ Error parsing WeCom XML:', error);
    return {};
  }
}

export default router;
