// backend-api/src/controllers/PermissionController.ts

import { Request, Response } from 'express';
import { Permissions } from '../models/Permissions';
import { Department } from '../models/Department';

export class PermissionController {
  // ✅ Grant permission to a role (RootAdmin / 院长)
  static async grantPermission(req: Request, res: Response): Promise<void> {
    try {
      const { role, module, departmentid, canaccess } = req.body;

      if (!role || !module) {
        res.status(400).json({ message: '角色和模块是必填项' });
        return;
      }

      const newPermission = await Permissions.create({
        role,
        module,
        departmentid: departmentid || null,
        canaccess: canaccess ?? true, // Default to true if not provided
      });

      res.status(201).json({
        message: '权限授予成功',
        permission: newPermission,
      });
    } catch (error) {
      console.error('❌ 授予权限失败:', error);
      res.status(500).json({ message: '无法授予权限' });
    }
  }

  // 🔍 View all permissions (Admin-only)
  static async getAllPermissions(_req: Request, res: Response): Promise<void> {
    try {
      const permissions = await Permissions.findAll({ include: [Department] });
      res.status(200).json({ permissions });
    } catch (error) {
      console.error('❌ 无法获取权限列表:', error);
      res.status(500).json({ message: '无法获取权限列表' });
    }
  }

  // 🔄 Update permission (RootAdmin only)
  static async updatePermission(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { canaccess } = req.body;

      const permission = await Permissions.findByPk(id);
      if (!permission) {
        res.status(404).json({ message: '未找到该权限' });
        return;
      }

      permission.canaccess = canaccess;
      await permission.save();

      res.status(200).json({
        message: '权限已更新',
        permission,
      });
    } catch (error) {
      console.error('❌ 无法更新权限:', error);
      res.status(500).json({ message: '无法更新权限' });
    }
  }

  // ❌ Revoke permission (RootAdmin-only)
  static async revokePermission(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const permission = await Permissions.findByPk(id);
      if (!permission) {
        res.status(404).json({ message: '未找到该权限' });
        return;
      }

      await permission.destroy();
      res.status(200).json({ message: '权限已撤销' });
    } catch (error) {
      console.error('❌ 无法撤销权限:', error);
      res.status(500).json({ message: '无法撤销权限' });
    }
  }
}
