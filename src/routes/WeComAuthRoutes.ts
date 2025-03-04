import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticateUser, AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { User } from '../models/User';
import { getWeComUser } from '../services/WeComService';

const router = Router();

// Securely retrieve JWT secret
const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL; // Ensure this is set in env variables

if (!JWT_SECRET) {
  throw new Error('🚨 Missing JWT_SECRET in environment variables! Server cannot run.');
}
if (!FRONTEND_URL) {
  console.warn('⚠️ FRONTEND_URL is not set in environment variables!');
}

/**
 * ✅ WeCom OAuth Callback Route
 * - Handles WeCom login via QR code authentication.
 */
router.get('/wecom-callback', async (req: Request, res: Response): Promise<any> => {
  try {
    const { code } = req.query;
    console.log(`🟡 WeCom OAuth Code Received: ${code}`);

    if (!code) {
      console.error(`❌ WeCom Callback Error: Missing OAuth Code`);
      return res.redirect(`${FRONTEND_URL}/login?error=missing_code`);
    }

    console.log(`🔍 Fetching WeCom user info for code: ${code}(wecom callback hit)`);
    const wecomUser = await getWeComUser(code as string);

    if (!wecomUser || !wecomUser.UserId) {
      console.warn(`⚠️ WeCom authentication failed, redirecting...`);
      return res.redirect(`${FRONTEND_URL}/login?error=wecom_auth_failed`);
    }

    console.log(`🔍 Searching for user in database with WeCom UserId: ${wecomUser.UserId}`);
    const user = await User.findOne({ where: { wecom_userid: wecomUser.UserId } });

    if (!user) {
      console.warn(`⚠️ WeCom user not linked to an account: ${wecomUser.UserId}`)
      return res.redirect(`${FRONTEND_URL}/login?error=unlinked_account`);
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        departmentid: user.departmentid,
        isglobalrole: user.isglobalrole,
        wecom_userid: user.wecom_userid, // ✅ Now included
        createdAt: user.createdAt, // ✅ Useful for frontend display
        updatedAt: user.updatedAt, // ✅ Useful for session tracking
      },
      JWT_SECRET as string,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      message: 'WeCom登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        departmentid: user.departmentid,
      },
    });
    console.log(`✅ WeCom login successful, redirecting user to: ${FRONTEND_URL}/login?token=XYZ`);
    res.redirect(`${FRONTEND_URL}/login?token=${token}`);
  } catch (error) {
    console.error('❌ WeCom 登录失败:', (error as Error).message);
    res.status(500).json({ message: 'WeCom 登录失败' });
    res.redirect(`${FRONTEND_URL}/login?error=internal_error`);
  }

 
});

    

/**
 * 🔑 WeCom Login API (For Mobile Apps / Non-QR Based Logins)
 */
router.post('/wecom-login', async (req: Request, res: Response): Promise<any> => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: '缺少WeCom授权码' });
    }

    console.log(`🔍 Fetching WeCom user info for code: ${code} (from /wecom-login)`);
    const wecomUser = await getWeComUser(code);
    if (!wecomUser || !wecomUser.userid) {
      return res.status(401).json({ message: 'WeCom认证失败' });
    }

    const user = await User.findOne({ where: { wecom_userid: wecomUser.userid } });
    if (!user) {
      return res.status(403).json({
        message: 'WeCom账号未绑定，请使用普通账号登录并绑定后再使用WeCom登录。',
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        departmentid: user.departmentid,
        isglobalrole: user.isglobalrole,
      },
      JWT_SECRET as string,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      message: 'WeCom登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        departmentid: user.departmentid,
      },
    });
  } catch (error) {
    console.error('❌ WeCom 登录失败:', (error as Error).message);
    res.status(500).json({ message: 'WeCom 登录失败' });
  }
});

/**
 * 🔗 WeCom Account Linking API
 */
router.post('/link-wecom', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { code, password } = req.body;

    if (!code || !password) {
      return res.status(400).json({ message: '缺少必要的参数' });
    }

    const wecomUser = await getWeComUser(code);
    if (!wecomUser || !wecomUser.userid) {
      return res.status(401).json({ message: 'WeCom认证失败' });
    }

    const user = await User.findByPk(req.user!.id);
    if (!user) {
      return res.status(404).json({ message: '用户未找到' });
    }

    if (user.wecom_userid) {
      return res.status(409).json({ message: '您的账号已绑定WeCom，无法重复绑定' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: '密码错误，无法绑定WeCom账号' });
    }

    const existingUserWithWeCom = await User.findOne({ where: { wecom_userid: wecomUser.userid } });
    if (existingUserWithWeCom) {
      return res.status(409).json({ message: '该WeCom账号已绑定至其他用户' });
    }

    user.wecom_userid = wecomUser.userid;
    await user.save();

    res.status(200).json({ message: 'WeCom账号绑定成功' });
  } catch (error) {
    console.error('❌ WeCom 绑定失败:', (error as Error).message);
    res.status(500).json({ message: 'WeCom 绑定失败' });
  }
});

export default router;
