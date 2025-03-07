import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { authenticateUser, AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { authorizeRole } from '../middlewares/RoleCheck';
import { getWeComUser } from '../services/WeComService';

const router = Router();

/**
 * 🛠 Centralized Error Handler
 */
const handleError = (res: Response, error: unknown, message: string, statusCode = 500) => {
  console.error(`❌ ${message}:`, (error as Error).message);
  res.status(statusCode).json({ message });
};

/**
 * 🔗 Link WeCom Account to User
 * - Requires authentication
 * - Verifies user’s password
 * - Ensures WeCom ID isn’t linked to another user
 */
router.post('/link-wecom', authenticateUser, async (req: AuthenticatedRequest, res: Response):Promise <any> => {
  try {
    const { code, password } = req.body;

    if (!code || !password) {
      return res.status(400).json({ message: '缺少必要的参数 (Missing required parameters)' });
    }

    const wecomUser = await getWeComUser(code);
    if (!wecomUser || !wecomUser.UserId) {
      return res.status(401).json({ message: 'WeCom认证失败 (WeCom authentication failed)' });
    }

    const user = await User.findByPk(req.user!.id);
    if (!user) {
      return res.status(404).json({ message: '用户未找到 (User not found)' });
    }

    if (user.wecom_userid) {
      return res.status(409).json({ message: '您的账号已绑定WeCom (Your account is already linked to WeCom)' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: '密码错误 (Incorrect password)' });
    }

    const existingUserWithWeCom = await User.findOne({ where: { wecom_userid: wecomUser.UserId } });
    if (existingUserWithWeCom) {
      return res.status(409).json({ message: '该WeCom账号已绑定至其他用户 (This WeCom account is already linked to another user)' });
    }

    await user.update({ wecom_userid: wecomUser.UserId });

    res.status(200).json({ message: 'WeCom账号绑定成功 (WeCom account linked successfully)' });
  } catch (error) {
    handleError(res, error, 'WeCom 绑定失败 (Failed to link WeCom account)');
  }
});

/**
 * ➕ Create a new user (Only Department Head or Admin)
 */
router.post(
  '/create',
  authenticateUser,
  authorizeRole(['部长', '科长']),
  async (req: AuthenticatedRequest, res: Response):Promise <any> => {
    try {
      const { username, role, password } = req.body;

      if (!username || !role || !password) {
        return res.status(400).json({ message: '请填写所有必填字段' });
      }

      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(409).json({ message: '用户名已存在' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create({
        username,
        role,
        departmentid: req.user!.departmentid,
        password_hash: hashedPassword,
        isglobalrole: false,
      });

      res.status(201).json({ message: '用户创建成功', user: newUser });
    } catch (error) {
      handleError(res, error, '创建用户失败');
    }
  }
);

/**
 * 🔍 Get all users (Only Admin or RootAdmin)
 */
router.get(
  '/',
  authenticateUser,
  authorizeRole(['RootAdmin', '院长']),
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password_hash'] },
      });
      res.status(200).json({ users });
    } catch (error) {
      handleError(res, error, '无法获取用户列表');
    }
  }
);

/**
 * 🔄 Update user role (Admin Only)
 */
router.patch(
  '/:id/role',
  authenticateUser,
  authorizeRole(['RootAdmin', '院长']),
  async (req: AuthenticatedRequest, res: Response):Promise<any> => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ message: '未找到用户' });
      }

      await user.update({ role });

      res.status(200).json({ message: '用户角色已更新', user });
    } catch (error) {
      handleError(res, error, '无法更新用户角色');
    }
  }
);

/**
 * 🔑 Reset user password (Admin Only)
 */
router.patch(
  '/:id/reset-password',
  authenticateUser,
  authorizeRole(['RootAdmin', '院长']),
  async (req: AuthenticatedRequest, res: Response):Promise<any> => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: '密码长度必须至少为6个字符' });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ message: '未找到用户' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await user.update({ password_hash: hashedPassword });

      res.status(200).json({ message: '用户密码已重置' });
    } catch (error) {
      handleError(res, error, '无法重置用户密码');
    }
  }
);

export default router;
