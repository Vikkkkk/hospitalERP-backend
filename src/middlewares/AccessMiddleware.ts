import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './AuthMiddleware';
import { Permissions } from '../models/Permissions';

// 🏗 **Role Hierarchy** (For inherited permissions)
const roleHierarchy: Record<string, string[]> = {
  RootAdmin: ["Admin", "DeptHead", "Staff"],
  Admin: ["DeptHead", "Staff"],
  DeptHead: ["Staff"],
  Staff: [],
};

/**
 * ✅ Middleware to check access based on **role hierarchy** & **canAccess (module-based)**
 */
export const authorizeAccess = (allowedModules: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction):Promise<any> => {
    if (!req.user) {
      return res.status(403).json({ message: '未经授权的访问 (Unauthorized Access)' });
    }

    const { role, departmentId, isglobalrole, username, canAccess=[] } = req.user;
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

    // ✅ **Check `canAccess` Field** (Module-Based)
    if (canAccess.some((module) => allowedModules.includes(module))) {
      console.log(`✅ Access Granted: User has explicit module access`);
      return next();
    }

    // 🔍 **Check in `Permissions` Table for Department-Based Access**
    const permission = await Permissions.findOne({
      where: {
        role,
        departmentId: departmentId || null, // Allow null for global roles
        canaccess: true,
      },
    });

    if (permission) {
      console.log(`✅ Access Granted: User has explicit permission from database`);
      return next();
    }

    // 🚨 **Access Denied**
    console.warn(`🚨 Access Denied: User ${username} (Role: ${role}, Dept: ${departmentId}) lacks permission`);
    return res.status(403).json({ message: '无权限访问该模块 (No permission to access this module)' });
  };
};
