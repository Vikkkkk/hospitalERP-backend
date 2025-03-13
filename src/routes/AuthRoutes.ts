import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models/User';
import { authenticateUser, AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { AuthController } from '../controllers/AuthController';

const router = Router();

// ✅ Ensure JWT_SECRET is properly set
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = parseInt(process.env.JWT_EXPIRY || "28800", 10); // ✅ Convert to number

if (!JWT_SECRET) {
  throw new Error('🚨 Missing JWT_SECRET in environment variables! Server cannot run.');
}

/**
 * 🔑 Generate JWT Token
 * - Includes WeCom ID (if linked)
 * - Uses secure environment variables
 */
const generateToken = (user: User): string => {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    departmentId: user.departmentId,
    isglobalrole: user.isglobalrole,
    wecom_userid: user.wecom_userid || null, // ✅ Explicitly set null if undefined
  };

  const options: SignOptions = { expiresIn: JWT_EXPIRY }; // ✅ Ensure correct type

  return jwt.sign(payload, JWT_SECRET as string, options); // ✅ TypeScript safe
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

    // 🔑 Compare input password with stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      console.warn(`❌ 密码错误: ${username}`);
      res.status(401).json({ message: '密码错误' });
      return;
    }

    // ✅ Generate JWT Token upon successful login
    const token = generateToken(user);
    console.log(`✅ 用户登录成功: ${username}`);

    res.status(200).json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        departmentId: user.departmentId,
        isglobalrole: user.isglobalrole,
        wecom_userid: user.wecom_userid || null, // ✅ Ensure it's returned properly
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
 * ✅ Verify JWT Token (Used for session persistence)
 */
router.get('/verify', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      message: 'Token 有效',
      user: req.user, // ✅ Pass authenticated user data
    });
  } catch (error) {
    console.error('❌ 令牌验证失败:', error);
    res.status(500).json({ message: '无法验证Token' });
  }
});

/**
 * 🚪 Logout Route (Handled by frontend token removal)
 */
router.post('/logout', authenticateUser, (_req: AuthenticatedRequest, res: Response): void => {
  res.status(200).json({ message: '登出成功，请在客户端清除Token' });
});

/**
 * 👤 Get Logged-In User Details
 * - Retrieves full user data for the profile page.
 */
router.get('/me', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.user!.id, {
      attributes: ['id', 'username', 'role', 'departmentId', 'isglobalrole', 'wecom_userid', 'createdAt', 'updatedAt'],
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


// ✨ New: Update user info (WeCom Binding, Profile Updates)
router.patch('/update', authenticateUser, AuthController.updateUser);

export default router;
