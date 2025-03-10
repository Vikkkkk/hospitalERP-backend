import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticateUser, AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { User } from '../models/User';
import { getWeComUser } from '../services/WeComService';
import { sequelize } from '../config/database';

const router = Router();

// Securely retrieve environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;
const JWT_EXPIRY = Number(process.env.JWT_EXPIRY) || 28800; // Default 8 hours (in seconds)

if (!JWT_SECRET) {
  throw new Error('🚨 Missing JWT_SECRET in environment variables! Server cannot run.');
}
if (!FRONTEND_URL) {
  console.warn('⚠️ FRONTEND_URL is not set in environment variables!');
}

/**
 * 📌 **Helper function for error responses**
 */
const sendErrorResponse = (res: Response, message: string, statusCode = 400) => {
  console.error(`❌ ${message}`);
  res.status(statusCode).json({ message });
};

/**
 * ✅ **WeCom OAuth Callback Route**
 * - Handles **both login & account linking** workflows.
 */
router.get('/wecom-callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, mode } = req.query;
    console.log(`🟡 WeCom OAuth Code Received: ${code}, Mode: ${mode}`);

    if (!code) {
      return res.redirect(`${FRONTEND_URL}/login?error=missing_code`);
    }

    console.log(`🔍 Fetching WeCom user info for code: ${code} (wecom callback hit)`);
    const wecomUser = await getWeComUser(code as string);

    if (!wecomUser?.UserId) {
      return res.redirect(`${FRONTEND_URL}/login?error=wecom_auth_failed`);
    }

    if (mode === 'link') {
      console.log(`🔗 Binding WeCom account for logged-in user`);
      return res.redirect(`${FRONTEND_URL}/profile?mode=confirm&wecom_userid=${wecomUser.UserId}`);
    }

    // 🔍 Search for an existing user in database for login
    const user = await User.findOne({ where: { wecom_userid: wecomUser.UserId } });

    if (!user) {
      return res.redirect(`${FRONTEND_URL}/login?error=unlinked_account`);
    }

    // ✅ Generate JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        departmentId: user.departmentId,
        isglobalrole: user.isglobalrole,
        wecom_userid: user.wecom_userid,
      },
      JWT_SECRET as string,
      { expiresIn: JWT_EXPIRY }
    );

    console.log(`✅ WeCom login successful, redirecting user.`);
    return res.redirect(`${FRONTEND_URL}/login?token=${token}`);
  } catch (error) {
    console.error('❌ WeCom 登录失败:', (error as Error).message);
    return res.redirect(`${FRONTEND_URL}/login?error=internal_error`);
  }
});

/**
 * 🔗 **Confirm WeCom Account Binding**
 */
router.post('/link-wecom', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();
  try {
    const { password, wecom_userid } = req.body;

    if (!password || !wecom_userid) {
      return sendErrorResponse(res, '缺少必要的参数 (Missing required parameters)');
    }

    const user = await User.findByPk(req.user!.id, { transaction });
    if (!user) {
      await transaction.rollback();
      return sendErrorResponse(res, '用户未找到 (User not found)', 404);
    }

    if (user.wecom_userid) {
      await transaction.rollback();
      return sendErrorResponse(res, '您的账号已绑定WeCom (Account already linked to WeCom)', 409);
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      await transaction.rollback();
      return sendErrorResponse(res, '密码错误 (Incorrect password)', 401);
    }

    // Ensure the WeCom ID isn't linked to another account
    const existingUserWithWeCom = await User.findOne({ where: { wecom_userid } });
    if (existingUserWithWeCom) {
      await transaction.rollback();
      return sendErrorResponse(res, '该WeCom账号已绑定至其他用户 (This WeCom account is already linked to another user)', 409);
    }

    // ✅ Store WeCom User ID after confirmation
    await User.update({ wecom_userid }, { where: { id: user.id }, transaction });

    await transaction.commit();
    console.log(`✅ User ${user.username} successfully linked WeCom ID: ${wecom_userid}`);
    res.status(200).json({ message: 'WeCom账号绑定成功 (WeCom account successfully linked)' });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ WeCom 绑定失败:', (error as Error).message);
    res.status(500).json({ message: 'WeCom 绑定失败 (Failed to link WeCom)' });
  }
});

/**
 * 🔴 **Unlink WeCom Account**
 * - Allows user to remove WeCom binding.
 */
router.post('/unlink-wecom', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();
  try {
    const user = await User.findByPk(req.user!.id, { transaction });

    if (!user) {
      await transaction.rollback();
      return sendErrorResponse(res, '用户未找到 (User not found)', 404);
    }

    if (!user.wecom_userid) {
      await transaction.rollback();
      return sendErrorResponse(res, '未绑定 WeCom 账号 (No WeCom account linked)', 400);
    }

    // ✅ Unbind WeCom account
    await User.update({ wecom_userid: null }, { where: { id: user.id }, transaction });

    await transaction.commit();
    console.log(`✅ User ${user.username} unlinked WeCom account`);
    res.status(200).json({ message: 'WeCom 账号解绑成功 (WeCom account successfully unlinked)' });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ WeCom 解绑失败:', (error as Error).message);
    res.status(500).json({ message: 'WeCom 解绑失败 (Failed to unlink WeCom)' });
  }
});

export default router;
