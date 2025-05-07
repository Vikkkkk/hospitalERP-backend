import { Router, Request, Response } from 'express';
import WechatCrypto from 'wechat-crypto';
import dotenv from 'dotenv';
import { handleWeComApprovalCallback } from '../services/WeComService';
import axios from 'axios';
import { User } from '../models/User';
import { InventoryRequest } from '../models/InventoryRequest';
import { Inventory } from '../models/Inventory';
import { InventoryTransaction } from '../models/InventoryTransaction';
import { InventoryService } from '../services/InventoryService';

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


router.get('/inventory-requests', async (req: Request, res: Response):Promise<any> => {
  const { code, state } = req.query;
  const requestId = Number(state);

  if (!code || !state) {
    return res.status(400).send('❌ 缺少必要参数 (code 或 state)');
  }

  try {
    // 🔐 Get WeCom Access Token
    const tokenRes = await axios.get(`https://qyapi.weixin.qq.com/cgi-bin/gettoken`, {
      params: {
        corpid: WECOM_CORP_ID,
        corpsecret: process.env.WECOM_CORP_SECRET,
      },
    });

    const access_token = tokenRes.data.access_token;
    // 👤 Get user info from code
    const userRes = await axios.get(`https://qyapi.weixin.qq.com/cgi-bin/user/getuserinfo`, {
      params: {
        access_token,
        code,
      },
    });

    const wecom_userid = userRes.data.UserId;
    if (!wecom_userid) return res.status(400).send('❌ 无法获取 WeCom 用户信息');

    // 🔍 Find user in system
    const user = await User.findOne({ where: { wecom_userid } });
    if (!user) return res.status(404).send('❌ 找不到用户');

    // 🔍 Find IR
    const request = await InventoryRequest.findByPk(requestId);
    if (!request || request.status !== 'Approved') {
      return res.status(400).send('❌ 无效的申请或已处理');
    }

    // if (request.requestedBy !== user.id) {
    //   return res.status(403).send('⛔️ 此申请不属于你，无法核销');
    // }
   console.log("request data:",request)
    // 🧾 Lookup department inventory item
    const departmentItem = await Inventory.findOne({
      where: {
        itemname: request.itemName,
        departmentId:null,
      },
    });

    if (!departmentItem) {
      return res.status(404).send('❌ 一级库中无此物品');
    }

    // ✅ Create transaction
    await InventoryTransaction.create({
      itemname: request.itemName,
      inventoryid: departmentItem.id,
      departmentId: request.departmentId,
      transactiontype: 'Checkout',
      quantity: request.quantity,
      performedby: user.id,
      checkoutUser: user.id,
      category: departmentItem.category,
    });

    await InventoryService.allocateFromBatches(departmentItem.id, request.quantity);

    request.status = 'Completed';
    await request.save();

    return res.send('✅ 核销成功！你可以关闭此窗口。');
  } catch (error) {
    console.error('❌ WeCom OAuth 核销失败:', error);
    return res.status(500).send('❌ 核销过程中出错');
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
