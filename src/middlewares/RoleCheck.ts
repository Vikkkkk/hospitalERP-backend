import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    globalRole?: string;
    departmentRole?: string;
  };
}

// Middleware for checking global and department roles
export const authorizeRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
    }

    const { globalRole, departmentRole } = user;

    if (
      (globalRole && allowedRoles.includes(globalRole)) ||
      (departmentRole && allowedRoles.includes(departmentRole))
    ) {
      return next();
    }

    return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
  };
};
