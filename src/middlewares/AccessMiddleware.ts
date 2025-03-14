import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './AuthMiddleware';
import { DepartmentPermissions } from '../models/DepartmentPermissions';

// 🏗 **Role Hierarchy** (Defines inherited permissions)
const roleHierarchy: Record<string, string[]> = {
  RootAdmin: ["Admin", "DeptHead", "Staff"],
  Admin: ["DeptHead", "Staff"],
  DeptHead: ["Staff"],
  Staff: [],
};

/**
 * ✅ Middleware to check access based on **role hierarchy**, **department rules**, and **explicit permissions**
 */
export const authorizeAccess = (allowedModules: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
    if (!req.user) {
      return res.status(403).json({ message: '未经授权的访问 (Unauthorized Access)' });
    }

    const { role, departmentId, isglobalrole, username, canAccess = [] } = req.user;
    console.log(`🔍 Access Check: User ${username} (Role: ${role}, Dept: ${departmentId}) trying to access: ${allowedModules}`);

    // ✅ **RootAdmin Always Has Full Access**
    if (isglobalrole) {
      console.log(`✅ Access Granted: ${role} has full permissions`);
      return next();
    }

    // ✅ **Check Role Hierarchy** (Inherited Permissions)
    const inheritedRoles = roleHierarchy[role] || [];
    const effectiveRoles = [role, ...inheritedRoles];

    if (allowedModules.some((mod) => effectiveRoles.includes(mod))) {
      console.log(`✅ Access Granted: ${role} inherits permission from ${effectiveRoles}`);
      return next();
    }

    // ✅ **Check User's `canAccess` Field** (Explicit Module Access)
    if (canAccess.some((module) => allowedModules.includes(module))) {
      console.log(`✅ Access Granted: User has explicit module access`);
      return next();
    }

    // 🔍 **Check Department-Based Permissions**
    if (departmentId) {
      const deptPermissions = await DepartmentPermissions.findAll({
        where: {
          departmentId: departmentId,
        },
      });

      if (deptPermissions.some((perm) => allowedModules.includes(perm.module))) {
        console.log(`✅ Access Granted: Department ${departmentId} has permission for ${allowedModules}`);
        return next();
      }
    }

    // 🚨 **Access Denied**
    console.warn(`🚨 Access Denied: User ${username} (Role: ${role}, Dept: ${departmentId}) lacks permission`);
    return res.status(403).json({ message: '无权限访问该模块 (No permission to access this module)' });
  };
};