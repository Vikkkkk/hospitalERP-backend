import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models/User';
import { authenticateUser, AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { AuthController } from '../controllers/AuthController';

const router = Router();

// ✅ Ensure JWT_SECRET is set securely
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = parseInt(process.env.JWT_EXPIRY || '28800', 10); // 8 hours default

if (!JWT_SECRET) {
  throw new Error('🚨 JWT_SECRET missing in env variables. Server cannot start.');
}

/**
 * 🔑 Generate JWT Token securely
 * - Includes user permissions for frontend use
 */
const generateToken = (user: User): string => {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    departmentId: user.departmentId,
    isglobalrole: user.isglobalrole,
    wecom_userid: user.wecom_userid || null,
    permissions: user.permissions || {}, // ✅ Include read/write permissions
  };

  const options: SignOptions = { expiresIn: JWT_EXPIRY };
  return jwt.sign(payload, JWT_SECRET as string, options);
};

/**
 * 🔐 User Login Route
 */
router.post('/login', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: '用户名和密码是必填项' });
      return;
    }

    const user = await User.findOne({ where: { username } });
    console.log(`🔍 Login Attempt: ${username}`);

    if (!user) {
      console.warn(`❌ 用户不存在: ${username}`);
      res.status(404).json({ message: '未找到用户' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      console.warn(`❌ 密码错误: ${username}`);
      res.status(401).json({ message: '密码错误' });
      return;
    }

    const token = generateToken(user);
    console.log(`✅ 登录成功: ${username}`);

    res.status(200).json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        departmentId: user.departmentId,
        isglobalrole: user.isglobalrole,
        wecom_userid: user.wecom_userid || null,
        permissions: user.permissions || {}, // ✅ Return permissions
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('❌ 登录失败:', error);
    res.status(500).json({ message: '登录失败，请稍后再试' });
  }
});

/**
 * ✅ Verify Token Route
 */
router.get('/verify', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      message: 'Token 有效',
      user: req.user, // ✅ Includes permissions
    });
  } catch (error) {
    console.error('❌ Token 验证失败:', error);
    res.status(500).json({ message: '无法验证 Token' });
  }
});

/**
 * 🚪 Logout (handled client-side)
 */
router.post('/logout', authenticateUser, (_req: AuthenticatedRequest, res: Response): void => {
  res.status(200).json({ message: '登出成功，请清除客户端 Token' });
});

/**
 * 👤 Get Current User Info
 */
router.get('/me', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.user!.id, {
      attributes: ['id', 'username', 'role', 'departmentId', 'isglobalrole', 'wecom_userid', 'permissions', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      res.status(404).json({ message: '用户未找到 (User not found)' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('❌ 获取用户信息失败:', error);
    res.status(500).json({ message: '无法获取用户信息' });
  }
});

/**
 * ✨ User Profile Update (WeCom Bind, etc.)
 */
router.patch('/update', authenticateUser, AuthController.updateUser);

export default router;