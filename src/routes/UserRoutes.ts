import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { authenticateUser, AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { authorizeAccess } from '../middlewares/AccessMiddleware';
import { Department } from '../models/Department';
import { InventoryTransaction } from '../models/InventoryTransaction';
import { ProcurementRequest } from '../models/ProcurementRequest';


const router = Router();

/**
 * 🛠 Centralized Error Handler
 */
const handleError = (res: Response, error: unknown, message: string, statusCode = 500) => {
  console.error(`❌ ${message}:`, (error as Error).message);
  res.status(statusCode).json({ message });
};

/**
 * 🔍 Get all active users (non-deleted)
 */
router.get(
  '/',
  authenticateUser,
  authorizeAccess(['RootAdmin', 'Admin']),
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password_hash'] },
        include: [{ model: Department, attributes: ['id', 'name'], as: 'userDepartment' }], // ✅ correct alias
        paranoid: true, // ✅ Exclude soft-deleted
      });

      res.status(200).json({
        users: users.map((user) => ({
          ...user.toJSON(),
          departmentName: user.userDepartment ? user.userDepartment.name : '无', // ✅ fix alias access
        })),
      });
    } catch (error) {
      console.error('❌ 获取用户列表失败:', error);
      res.status(500).json({ message: '无法获取用户列表' });
    }
  }
);

/**
 * 🔍 Get all soft-deleted users
 */
router.get(
  '/deleted',
  authenticateUser,
  authorizeAccess(['RootAdmin', 'Admin']),
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password_hash'] },
        include: [{ model: Department, attributes: ['id', 'name'], as: 'userDepartment' }],
        paranoid: false, // ✅ Fetches all users (including soft-deleted)
      });

      // ✅ Manually filter out only soft-deleted users
      const deletedUsers = users.filter(user => user.deletedAt !== null);

      res.status(200).json({
        users: deletedUsers.map((user) => ({
          ...user.toJSON(),
          departmentName: user.userDepartment ? user.userDepartment.name : '无',
        })),
      });
    } catch (error) {
      handleError(res, error, '无法获取被删除的用户');
    }
  }
);

/**
 * ➕ Create a new user (Only Admins & Department Heads)
 */
router.post(
  '/create',
  authenticateUser,
  authorizeAccess(['user-management'], 'write'), // 🛡️ Require write access to user management
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { username, role, password, departmentId, permissions } = req.body;

      if (!username || !role || !password) {
        return res.status(400).json({ message: '请填写所有必填字段' });
      }

      // 🔎 Check if user exists (even soft-deleted)
      const existingUser = await User.findOne({ where: { username }, paranoid: false });
      if (existingUser) {
        return res.status(409).json({ message: '用户名已存在' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // 🔐 Validate permissions format (optional strict check)
      if (permissions && typeof permissions !== 'object') {
        return res.status(400).json({ message: '权限格式无效 (Invalid permissions format)' });
      }

      const newUser = await User.create({
        username,
        role,
        departmentId: departmentId || req.user!.departmentId,
        password_hash: hashedPassword,
        isglobalrole: false,
        permissions: permissions || {}, // ✅ Store permissions object
      });

      res.status(201).json({ message: '✅ 用户创建成功', user: newUser });
    } catch (error) {
      handleError(res, error, '❌ 创建用户失败');
    }
  }
);

/**
 * 🔄 Update User Info (Admin only)
 */
router.patch(
  '/:id',
  authenticateUser,
  authorizeAccess(['user-management'], 'write'), // 🛡️ Write permission required
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { id } = req.params;
      const { role, departmentId, permissions } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ message: '未找到用户' });
      }

      // 🔍 Optional validation on permissions structure
      if (permissions && typeof permissions !== 'object') {
        return res.status(400).json({ message: '权限格式无效 (Invalid permissions format)' });
      }

      await user.update({
        role,
        departmentId: departmentId ?? user.departmentId,
        permissions: permissions || {}, // ✅ Update permissions directly
      });

      // 🔄 Fetch updated user with department info
      const updatedUser = await User.findByPk(id, {
        attributes: { exclude: ['password_hash'] },
        include: [{ model: Department, attributes: ['id', 'name'], as: 'userDepartment' }],
      });

      if (!updatedUser) {
        return res.status(404).json({ message: '无法获取更新后的用户' });
      }

      res.status(200).json({
        message: '✅ 用户信息已更新',
        user: {
          ...updatedUser.toJSON(),
          departmentName: updatedUser.userDepartment ? updatedUser.userDepartment.name : '无',
        },
      });
    } catch (error) {
      handleError(res, error, '❌ 无法更新用户信息');
    }
  }
);

/**
 * 🔑 Reset user password (Admin Only)
 */
router.patch(
  '/:id/reset-password',
  authenticateUser,
  authorizeAccess(['RootAdmin', 'Admin']),
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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

/**
 * ➖ Delete a user (Only Admins)
 */
router.delete(
  '/:id',
  authenticateUser,
  authorizeAccess(['RootAdmin', 'Admin']),
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ message: '未找到用户' });
      }

      if (user.role === 'RootAdmin') {
        return res.status(403).json({ message: '无法删除 RootAdmin 用户' });
      }

      // 🔍 Check if the user has interactions in InventoryTransaction or ProcurementRequest
      const hasTransactions = await InventoryTransaction.findOne({ where: { performedby: id } });
      const hasProcurementRequests = await ProcurementRequest.findOne({ where: { requestedBy: id } });

      if (!hasTransactions && !hasProcurementRequests) {
        console.log(`✅ User ${id} has no interactions, performing HARD delete.`);
        await user.destroy({ force: true }); // 🔹 Hard delete
        return res.status(200).json({ message: '用户已永久删除' });
      }

      console.log(`⚠️ User ${id} has interactions, performing SOFT delete.`);
      await user.destroy(); // 🔹 Soft delete (default behavior)
      res.status(200).json({ message: '用户已软删除 (可恢复)' });

    } catch (error) {
      handleError(res, error, '无法删除用户');
    }
  }
);

/**
 * 🔄 Restore a soft-deleted user
 */
router.patch(
  '/:id/restore',
  authenticateUser,
  authorizeAccess(['RootAdmin', 'Admin']),
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { id } = req.params;

      await User.restore({ where: { id } });
      res.status(200).json({ message: '用户已恢复' });

    } catch (error) {
      handleError(res, error, '无法恢复用户');
    }
  }
);

export default router;