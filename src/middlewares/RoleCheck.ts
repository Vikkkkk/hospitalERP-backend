import { Request, Response, NextFunction } from 'express';
import { Permissions } from '../models/Permissions';
import { AuthenticatedRequest } from './AuthMiddleware';

export const authorizeRole = (allowedRoles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction):Promise<any> => {
    if (!req.user) {
      return res.status(403).json({ message: '未经授权的访问' });
    }

    const { role, departmentid, isglobalrole } = req.user;

    // RootAdmin or global roles have full access
    if (isglobalrole || allowedRoles.includes(role)) {
      return next();
    }

    // Check permissions from the Permissions table
    const permission = await Permissions.findOne({
      where: {
        role,
        departmentid,
        canaccess: true,
      },
    });

    if (!permission) {
      return res.status(403).json({ message: '无权限访问该模块' });
    }

    next();
  };
};
