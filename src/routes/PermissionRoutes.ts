import { Router, Response } from 'express';
import { Permissions } from '../models/Permissions';
import { authenticateUser, AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { authorizeRole } from '../middlewares/RoleCheck';

const router = Router();

// 📝 Create a new permission
router.post(
  '/',
  authenticateUser,
  authorizeRole(['RootAdmin', '院长']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { role, module, canaccess, departmentid } = req.body;

      if (!role || !module) {
        res.status(400).json({ message: '角色和模块名称是必填项' });
        return;
      }

      const existingPermission = await Permissions.findOne({
        where: { role, module, departmentid },
      });

      if (existingPermission) {
        res.status(409).json({ message: '该权限已存在' });
        return;
      }

      const newPermission = await Permissions.create({
        role,
        module,
        canaccess: canaccess !== undefined ? canaccess : true,
        departmentid,
      });

      res.status(201).json({
        message: '权限已成功创建',
        permission: newPermission,
      });
    } catch (error) {
      console.error('❌ 创建权限失败:', error);
      res.status(500).json({ message: '无法创建权限' });
    }
  }
);

// 🔍 Get all permissions (Visible to Admins)
router.get(
  '/',
  authenticateUser,
  authorizeRole(['RootAdmin', '院长', '副院长']),
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const permissions = await Permissions.findAll();
      res.status(200).json({ permissions });
    } catch (error) {
      console.error('❌ 无法获取权限列表:', error);
      res.status(500).json({ message: '无法获取权限列表' });
    }
  }
);

// 🔄 Update permission (Admins only)
router.patch(
  '/:id',
  authenticateUser,
  authorizeRole(['RootAdmin', '院长']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { role, module, canaccess } = req.body;

      const permission = await Permissions.findByPk(id);
      if (!permission) {
        res.status(404).json({ message: '未找到权限' });
        return;
      }

      permission.role = role || permission.role;
      permission.module = module || permission.module;
      permission.canaccess = canaccess !== undefined ? canaccess : permission.canaccess;
      await permission.save();

      res.status(200).json({
        message: '权限已更新',
        permission,
      });
    } catch (error) {
      console.error('❌ 无法更新权限:', error);
      res.status(500).json({ message: '更新权限失败' });
    }
  }
);

// ❌ Delete a permission
router.delete(
  '/:id',
  authenticateUser,
  authorizeRole(['RootAdmin']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const permission = await Permissions.findByPk(id);
      if (!permission) {
        res.status(404).json({ message: '未找到权限' });
        return;
      }

      await permission.destroy();

      res.status(200).json({ message: '权限已删除' });
    } catch (error) {
      console.error('❌ 删除权限失败:', error);
      res.status(500).json({ message: '无法删除权限' });
    }
  }
);

export default router;
