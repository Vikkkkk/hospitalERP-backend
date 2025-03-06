import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticateUser, AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { User } from '../models/User';
import { getWeComUser } from '../services/WeComService';

const router = Router();

// Securely retrieve JWT secret
const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;

if (!JWT_SECRET) {
  throw new Error('🚨 Missing JWT_SECRET in environment variables! Server cannot run.');
}
if (!FRONTEND_URL) {
  console.warn('⚠️ FRONTEND_URL is not set in environment variables!');
}

/**
 * ✅ WeCom OAuth Callback Route
 * - Handles both login & account linking
 */
router.get('/wecom-callback', async (req: Request, res: Response): Promise<any> => {
  try {
    const { code, mode } = req.query;
    console.log(`🟡 WeCom OAuth Code Received: ${code}, Mode: ${mode}`);

    if (!code) {
      console.error(`❌ WeCom Callback Error: Missing OAuth Code`);
      return res.redirect(`${FRONTEND_URL}/login?error=missing_code`);
    }

    console.log(`🔍 Fetching WeCom user info for code: ${code} (wecom callback hit)`);
    const wecomUser = await getWeComUser(code as string);

    if (!wecomUser || !wecomUser.UserId) {
      console.warn(`⚠️ WeCom authentication failed, redirecting...`);
      return res.redirect(`${FRONTEND_URL}/login?error=wecom_auth_failed`);
    }

    // 🔗 **If linking, require authentication & store User ID**
    if (mode === 'link') {
      console.log(`🔗 Binding WeCom account for logged-in user`);
      return res.redirect(`${FRONTEND_URL}/profile?mode=confirm&wecom_userid=${wecomUser.UserId}`);
    }

    // 🔍 Searching for existing user in database for login
    const user = await User.findOne({ where: { wecom_userid: wecomUser.UserId } });

    if (!user) {
      console.warn(`⚠️ WeCom user not linked to an account: ${wecomUser.UserId}`);
      return res.redirect(`${FRONTEND_URL}/login?error=unlinked_account`);
    }

    // ✅ Generate JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        departmentid: user.departmentid,
        isglobalrole: user.isglobalrole,
        wecom_userid: user.wecom_userid,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      JWT_SECRET as string,
      { expiresIn: '8h' }
    );

    console.log(`✅ WeCom login successful, redirecting user to: ${FRONTEND_URL}/login?token=${token}`);
    return res.redirect(`${FRONTEND_URL}/login?token=${token}`);
  } catch (error) {
    console.error('❌ WeCom 登录失败:', (error as Error).message);
    return res.redirect(`${FRONTEND_URL}/login?error=internal_error`);
  }
});

/**
 * 🔗 **Confirm WeCom Account Binding**
 */
router.post('/link-wecom', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { password, wecom_userid } = req.body;

    if (!password || !wecom_userid) {
      return res.status(400).json({ message: '缺少必要的参数 (Missing required parameters)' });
    }

    const user = await User.findByPk(req.user!.id);
    if (!user) {
      return res.status(404).json({ message: '用户未找到 (User not found)' });
    }

    if (user.wecom_userid) {
      return res.status(409).json({ message: '您的账号已绑定WeCom (Account already linked to WeCom)' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: '密码错误 (Incorrect password)' });
    }

    // ✅ Store WeCom User ID after confirmation
    await User.update(
      { wecom_userid: wecom_userid }, // ✅ Only update wecom_userid
      { where: { id: user.id } }
    );

    console.log(`✅ User ${user.username} successfully linked WeCom ID: ${wecom_userid}`);

    return res.status(200).json({ message: 'WeCom账号绑定成功 (WeCom account successfully linked)' });
  } catch (error) {
    console.error('❌ WeCom 绑定失败:', (error as Error).message);
    return res.status(500).json({ message: 'WeCom 绑定失败 (Failed to link WeCom)' });
  }
});

/**
 * 🔴 **Unlink WeCom Account**
 * - Allows user to remove WeCom binding
 */
/**
 * 🔴 **Unlink WeCom Account**
 * - Allows user to remove WeCom binding
 */
router.post('/unlink-wecom', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const user = await User.findByPk(req.user!.id);
    
    if (!user) {
      console.warn(`❌ User not found: ${req.user!.id}`);
      return res.status(404).json({ message: '用户未找到 (User not found)' });
    }

    if (!user.wecom_userid) {
      console.warn(`⚠️ User ${user.username} has no linked WeCom account.`);
      return res.status(400).json({ message: '未绑定 WeCom 账号 (No WeCom account linked)' });
    }

    // ✅ Unbind WeCom account
    user.wecom_userid = null;
    await User.update(
      { wecom_userid: user.wecom_userid }, // ✅ Only update this field
      { where: { id: user.id } }
    );
    

    console.log(`✅ User ${user.username} unlinked WeCom account`);

    return res.status(200).json({ message: 'WeCom 账号解绑成功 (WeCom account successfully unlinked)' });
  } catch (error) {
    console.error('❌ WeCom 解绑失败:', (error as Error).message);
    return res.status(500).json({ message: 'WeCom 解绑失败 (Failed to unlink WeCom)' });
  }
});


export default router;
