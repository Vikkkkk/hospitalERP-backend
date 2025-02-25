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

    if (!user) {
      res.status(404).json({ message: '未找到用户' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ message: '密码错误' });
      return;
    }

    // Generate a token
    const token = generateToken(user);

    res.status(200).json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        departmentid: user.departmentid,
        isglobalrole: user.isglobalrole,
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

export default router;
