// backend-api/src/services/PermissionService.ts

import { Permissions } from '../models/Permissions';
import { User } from '../models/User';

export class PermissionService {
  /**
   * ✅ Check if a user has permission to access a specific module
   */
  static async hasPermission(userId: number, module: string): Promise<boolean> {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        console.error(`❌ 用户ID为 ${userId} 的用户未找到`);
        return false;
      }

      // Global role permissions
      if (user.isglobalrole) {
        const globalPermission = await Permissions.findOne({
          where: {
            role: user.role,
            module,
            departmentid: null, // Global permissions
          },
        });

        if (globalPermission && globalPermission.canaccess) {
          return true;
        }
      }

      // Department-specific permissions
      const departmentPermission = await Permissions.findOne({
        where: {
          role: user.role,
          module,
          departmentid: user.departmentid,
        },
      });

      if (departmentPermission && departmentPermission.canaccess) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ 权限检查失败:', error);
      return false;
    }
  }

  /**
   * ➕ Grant permission for a role in a department
   */
  static async grantPermission(role: string, module: string, departmentid: number | null): Promise<void> {
    try {
      await Permissions.create({
        role,
        module,
        departmentid,
        canaccess: true,
      });

      console.log(`✅ 授予角色 ${role} 对模块 ${module} 的访问权限`);
    } catch (error) {
      console.error('❌ 授权失败:', error);
    }
  }

  /**
   * ❌ Revoke permission for a role in a department
   */
  static async revokePermission(role: string, module: string, departmentid: number | null): Promise<void> {
    try {
      const permission = await Permissions.findOne({
        where: { role, module, departmentid },
      });

      if (permission) {
        permission.canaccess = false;
        await permission.save();
        console.log(`✅ 撤销角色 ${role} 对模块 ${module} 的访问权限`);
      }
    } catch (error) {
      console.error('❌ 撤销权限失败:', error);
    }
  }
}
