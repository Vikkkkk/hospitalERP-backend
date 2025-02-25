import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { authenticateUser, AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { authorizeRole } from '../middlewares/RoleCheck';

const router = Router();

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
        departmentid: req.user!.departmentid, // Inherit department from the creator
        password: hashedPassword,
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
      user.password = hashedPassword;
      await user.save();

      res.status(200).json({ message: '用户密码已重置' });
    } catch (error) {
      console.error('❌ 重置密码失败:', error);
      res.status(500).json({ message: '无法重置密码' });
    }
  }
);

export default router;
