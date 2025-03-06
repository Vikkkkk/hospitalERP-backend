import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { authenticateUser, AuthenticatedRequest } from '../middlewares/AuthMiddleware';

const router = Router();

// Generate JWT token
const generateToken = (user: any): string => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      departmentid: user.departmentid,
      isglobalrole: user.isglobalrole,
      username: user.username,
      wecom_userid: user.wecom_userid, // ✅ Ensure this is included!
    },
    process.env.JWT_SECRET || 'supersecretkey', // Store JWT_SECRET in .env
    { expiresIn: '8h' }
  );
};

// User Login
router.post('/login', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: '用户名和密码是必填项' });
      return;
    }

    const user = await User.findOne({ where: { username } });

    console.log("🔍 Login Request:", { username, enteredPassword: password });

    if (!user) {
      console.warn(`❌ User not found: ${username}`);
      res.status(404).json({ message: '未找到用户' });
      return;
    }

    console.log("🟢 Found User:", { id: user.id, username: user.username, storedHash: user.password_hash });

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log("comparing passwords", {
      input: password,
      stored: user.password_hash,
      match: isPasswordValid
    });

    console.log("🔍 Login Attempt:", { username, enteredPassword: password, storedHash: user.password_hash, passwordMatch: isPasswordValid });

    if (!isPasswordValid) {
      console.warn(`❌ Password mismatch for user: ${username}`);
      res.status(401).json({ message: '密码错误' });
      return;
    }

    // ✅ Generate a token with wecom_userid
    const token = generateToken(user);
    console.log("✅ Token Generated:", token);

    // ✅ Return full user info including WeCom ID
    res.status(200).json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        departmentid: user.departmentid,
        isglobalrole: user.isglobalrole,
        wecom_userid: user.wecom_userid, // ✅ Include in response
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('❌ 登录失败:', error);
    res.status(500).json({ message: '登录失败' });
  }
});

// Verify Token
router.get('/verify', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      message: 'Token 有效',
      user: req.user, // req.user will now be correctly recognized by TypeScript
    });
  } catch (error) {
    console.error('❌ 无法验证Token:', error);
    res.status(500).json({ message: '无法验证Token' });
  }
});

// Logout (Frontend should handle token removal)
router.post('/logout', authenticateUser, (_req: AuthenticatedRequest, res: Response): void => {
  res.status(200).json({ message: '登出成功，请在客户端清除Token' });
});

// ✅ Get logged-in user details (for profile page)
router.get('/me', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const user = await User.findByPk(req.user!.id, {
      attributes: ['id', 'username', 'role', 'departmentid', 'isglobalrole', 'wecom_userid', 'createdAt', 'updatedAt']
    });

    if (!user) {
      return res.status(404).json({ message: '用户未找到 (User not found)' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('❌ 获取用户信息失败:', (error as Error).message);
    res.status(500).json({ message: '无法获取用户信息 (Failed to fetch user info)' });
  }
});

export default router;
