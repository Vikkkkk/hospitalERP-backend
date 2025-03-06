import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { authenticateUser, AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { authorizeRole } from '../middlewares/RoleCheck';
import { getWeComUser } from '../services/WeComService';

const router = Router();

/**
 * 🔗 Link WeCom Account to User
 * - Requires authentication
 * - Verifies user’s password
 * - Ensures WeCom ID isn’t linked to another user
 */
router.post('/link-wecom', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { code, password } = req.body;

    if (!code || !password) {
      res.status(400).json({ message: '缺少必要的参数 (Missing required parameters)' });
      return;
    }

    // Retrieve WeCom user info using the OAuth code
    const wecomUser = await getWeComUser(code);
    if (!wecomUser || !wecomUser.UserId) {
      res.status(401).json({ message: 'WeCom认证失败 (WeCom authentication failed)' });
      return;
    }

    // Find the authenticated user
    const user = await User.findByPk(req.user!.id);
    if (!user) {
      res.status(404).json({ message: '用户未找到 (User not found)' });
      return;
    }

    // Ensure the user isn't already linked to a WeCom account
    if (user.wecom_userid) {
      res.status(409).json({ message: '您的账号已绑定WeCom (Your account is already linked to WeCom)' });
      return;
    }

    // Verify password before linking
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      res.status(401).json({ message: '密码错误 (Incorrect password)' });
      return;
    }

    // Ensure the WeCom user isn't linked to another account
    const existingUserWithWeCom = await User.findOne({ where: { wecom_userid: wecomUser.UserId } });
    if (existingUserWithWeCom) {
      res.status(409).json({ message: '该WeCom账号已绑定至其他用户 (This WeCom account is already linked to another user)' });
      return;
    }

    // Link WeCom account to user
    user.wecom_userid = wecomUser.UserId;
    await user.save();

    res.status(200).json({ message: 'WeCom账号绑定成功 (WeCom account linked successfully)' });
  } catch (error) {
    console.error('❌ WeCom 绑定失败:', (error as Error).message);
    res.status(500).json({ message: 'WeCom 绑定失败 (Failed to link WeCom account)' });
  }
});

// ➕ Create a new user (Only Department Head)
router.post(
  '/create',
  authenticateUser,
  authorizeRole(['部长', '科长']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { username, role, password } = req.body;

      if (!username || !role || !password) {
        res.status(400).json({ message: '请填写所有必填字段' });
        return;
      }

      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        res.status(409).json({ message: '用户名已存在' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        username,
        role,
        departmentid: req.user!.departmentid,
        password_hash: hashedPassword,
        isglobalrole: false,
      });

      res.status(201).json({
        message: '用户创建成功',
        user: newUser,
      });
    } catch (error) {
      console.error('❌ 创建用户失败:', error);
      res.status(500).json({ message: '创建用户失败' });
    }
  }
);

// 🔍 Get all users (Only Admin access)
router.get(
  '/',
  authenticateUser,
  authorizeRole(['RootAdmin', '院长']),
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const users = await User.findAll();
      res.status(200).json({ users });
    } catch (error) {
      console.error('❌ 无法获取用户列表:', error);
      res.status(500).json({ message: '无法获取用户列表' });
    }
  }
);

// 🔄 Update user role (Admin Only)
router.patch(
  '/:id/role',
  authenticateUser,
  authorizeRole(['RootAdmin', '院长']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        res.status(404).json({ message: '未找到用户' });
        return;
      }

      user.role = role;
      await user.save();

      res.status(200).json({
        message: '用户角色已更新',
        user,
      });
    } catch (error) {
      console.error('❌ 更新角色失败:', error);
      res.status(500).json({ message: '无法更新用户角色' });
    }
  }
);

// 🔑 Reset user password (Admin Only)
router.patch(
  '/:id/reset-password',
  authenticateUser,
  authorizeRole(['RootAdmin', '院长']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        res.status(404).json({ message: '未找到用户' });
        return;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password_hash = hashedPassword;
      await user.save();

      res.status(200).json({ message: '用户密码已重置' });
    } catch (error) {
      console.error('❌ 重置密码失败:', error);
      res.status(500).json({ message: '无法重置密码' });
    }
  }
);

export default router;
