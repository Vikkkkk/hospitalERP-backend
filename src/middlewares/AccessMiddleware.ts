import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './AuthMiddleware';

// 🏗 Role Hierarchy: Defines inherited permissions
const roleHierarchy: Record<string, string[]> = {
  RootAdmin: ['Admin', 'DeptHead', 'Staff'],
  Admin: ['DeptHead', 'Staff'],
  DeptHead: ['Staff'],
  Staff: [],
};

/**
 * ✅ Middleware to check access based on:
 * - Role Hierarchy
 * - Explicit User Permissions (read/write)
 */
export const authorizeAccess = (
  allowedModules: string[],
  requiredAccess: 'read' | 'write' = 'read' // Default access level required
) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
      if (!req.user) {
        return res.status(403).json({ message: '未经授权的访问 (Unauthorized Access)' });
      }

      const { role, isglobalrole, username, permissions = {} } = req.user;

      console.log(
        `🔍 Access Check: ${username} [${role}] attempting ${requiredAccess.toUpperCase()} on ${allowedModules.join(', ')} | ${req.method} ${req.path}`
      );

      // ✅ Global User Shortcut
      if (isglobalrole) {
        console.log(`✅ Access Granted: RootAdmin privileges`);
        return next();
      }

      // Normalize for comparison
      const normalizedModules = allowedModules.map(m => m.toLowerCase());
      const inheritedRoles = roleHierarchy[role] || [];
      const effectiveRoles = [role, ...inheritedRoles].map(r => r.toLowerCase());

      // ✅ Role Hierarchy Check
      if (normalizedModules.some((mod) => effectiveRoles.includes(mod))) {
        console.log(`✅ Access Granted via role hierarchy: ${effectiveRoles}`);
        return next();
      }

      // ✅ Explicit Permission Check
      const hasExplicitPermission = normalizedModules.some((module) => {
        const modulePerm = permissions[module];
        return modulePerm && modulePerm[requiredAccess] === true;
      });

      if (hasExplicitPermission) {
        console.log(`✅ Access Granted via explicit ${requiredAccess} permission`);
        return next();
      }

      // 🚨 Access Denied
      console.warn(`🚨 Access Denied: ${username} lacks ${requiredAccess} access to ${allowedModules}`);
      return res.status(403).json({ message: '无权限访问该模块 (No permission to access this module)' });

    } catch (err) {
      console.error(`❌ Access Middleware Error:`, err);
      return res.status(500).json({ message: '访问控制中发生错误 (Error in access control)' });
    }
  };
};