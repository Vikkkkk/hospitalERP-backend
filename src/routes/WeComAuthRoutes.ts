import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticateUser, AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { User } from '../models/User';
import { getWeComUser } from '../services/WeComService';

const router = Router();

/**
 * 🔑 WeCom Login API
 * - Verifies WeCom user identity using OAuth.
 * - If `wecom_userid` is linked, logs in the user securely.
 * - If not linked, denies login and requires manual linking.
 */
router.post('/wecom-login', async (req: Request, res: Response):Promise<any> => {
  try {
    const { code } = req.body; // WeCom authorization code

    if (!code) {
      return res.status(400).json({ message: '缺少WeCom授权码' });
    }

    // Fetch WeCom user info using the code
    const wecomUser = await getWeComUser(code);

    if (!wecomUser || !wecomUser.userid) {
      return res.status(401).json({ message: 'WeCom认证失败' });
    }

    // Check if a user is linked with this wecom_userid
    const user = await User.findOne({ where: { wecom_userid: wecomUser.userid } });

    if (!user) {
      return res.status(403).json({
        message: 'WeCom账号未绑定，请使用普通账号登录并绑定后再使用WeCom登录。',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        departmentid: user.departmentid,
        isglobalrole: user.isglobalrole,
      },
      process.env.JWT_SECRET as string,
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
    console.error('❌ WeCom 登录失败:', error);
    res.status(500).json({ message: 'WeCom 登录失败' });
  }
});

/**
 * 🔗 WeCom Account Linking API
 * - Allows users to link their WeCom account **after logging in**.
 * - Requires confirmation of **existing password**.
 * - Prevents unauthorized users from linking accounts.
 */
router.post('/link-wecom', authenticateUser, async (req: AuthenticatedRequest, res: Response):Promise<any> => {
  try {
    const { code, password } = req.body;

    if (!code || !password) {
      return res.status(400).json({ message: '缺少必要的参数' });
    }

    // Fetch WeCom user info using the code
    const wecomUser = await getWeComUser(code);

    if (!wecomUser || !wecomUser.userid) {
      return res.status(401).json({ message: 'WeCom认证失败' });
    }

    // Ensure the logged-in user is verifying their own account
    const user = await User.findByPk(req.user!.id);
    if (!user) {
      return res.status(404).json({ message: '用户未找到' });
    }

    // Verify password before linking WeCom account
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: '密码错误，无法绑定WeCom账号' });
    }

    // Ensure the WeCom account is not already linked
    const existingUserWithWeCom = await User.findOne({ where: { wecom_userid: wecomUser.userid } });
    if (existingUserWithWeCom) {
      return res.status(409).json({ message: '该WeCom账号已绑定至其他用户' });
    }

    // Link WeCom account to the user
    user.wecom_userid = wecomUser.userid;
    await user.save();

    res.status(200).json({ message: 'WeCom账号绑定成功' });
  } catch (error) {
    console.error('❌ WeCom 绑定失败:', error);
    res.status(500).json({ message: 'WeCom 绑定失败' });
  }
});

export default router;
