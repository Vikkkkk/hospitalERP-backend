import { Request, Response, NextFunction } from 'express';
import { Permissions } from '../models/Permissions';
import { AuthenticatedRequest } from './AuthMiddleware';

const roleHierarchy: Record<string, string[]> = {
  RootAdmin: ["Admin", "DeptHead", "Staff"],
  Admin: ["DeptHead", "Staff"],
  DeptHead: ["Staff"],
  Staff: [],
};

export const authorizeRole = (allowedRoles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
    if (!req.user) {
      return res.status(403).json({ message: '未经授权的访问' });
    }

    const { role, departmentId, isglobalrole, username } = req.user;

    console.log(`🔍 RoleCheck: User ${username} (Role: ${role}, Dept: ${departmentId}) attempting access`);

    // ✅ RootAdmin & Global Roles: Full Access
    if (isglobalrole || allowedRoles.includes(role)) {
      console.log(`✅ Access Granted: ${role} has full permissions`);
      return next();
    }

    // ✅ Check if role has inherited permissions from hierarchy
    const inheritedRoles = roleHierarchy[role] || [];
    const effectiveRoles = [role, ...inheritedRoles];

    if (allowedRoles.some((allowed) => effectiveRoles.includes(allowed))) {
      console.log(`✅ Access Granted: ${role} inherits permission from ${effectiveRoles}`);
      return next();
    }

    // 🔍 Check in `Permissions` model for specific department-level access
    const permission = await Permissions.findOne({
      where: {
        role,
        departmentId: departmentId || null, // Handle null departmentId as wildcard
        canaccess: true,
      },
    });

    if (!permission) {
      console.warn(`🚨 Access Denied: User ${username} (Role: ${role}, Dept: ${departmentId}) lacks required permissions`);
      return res.status(403).json({ message: '无权限访问该模块' });
    }

    console.log(`✅ Access Granted: User ${username} has explicit permission from database`);
    next();
  };
};

export const checkRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(403).json({ message: '未经授权的访问 (Unauthorized Access)' });
    }

    const { role, username } = req.user;

    console.log(`🔍 RoleCheck: User ${username} (Role: ${role}) attempting restricted action`);

    if (!allowedRoles.includes(role)) {
      console.warn(`🚨 Access Denied: User ${username} (Role: ${role}) lacks required permission`);
      return res.status(403).json({ message: '无权限执行该操作 (No permission to perform this action)' });
    }

    console.log(`✅ Access Granted: User ${username} allowed to perform action`);
    next();
  };
};


export const authorizeAction = (requiredAction: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
    if (!req.user) {
      return res.status(403).json({ message: '未经授权的访问 (Unauthorized Access)' });
    }

    const { role, departmentId, isglobalrole, username } = req.user;

    console.log(`🔍 RoleCheck: User ${username} (Role: ${role}, Dept: ${departmentId}) attempting action: ${requiredAction}`);

    // ✅ RootAdmin always has full access
    if (isglobalrole) {
      console.log(`✅ Access Granted: ${role} has full permissions`);
      return next();
    }

    // 🔍 Check if this role has permission for the specific action
    const permission = await Permissions.findOne({
      where: {
        role,
        departmentId: departmentId || null, // Handle null departmentId as wildcard
        [requiredAction]: true,  // 🔥 Check if action is allowed
      },
    });

    if (!permission) {
      console.warn(`🚨 Access Denied: User ${username} (Role: ${role}, Dept: ${departmentId}) lacks permission for ${requiredAction}`);
      return res.status(403).json({ message: '无权限执行该操作 (No permission to perform this action)' });
    }

    console.log(`✅ Access Granted: User ${username} allowed to perform ${requiredAction}`);
    next();
  };
};
