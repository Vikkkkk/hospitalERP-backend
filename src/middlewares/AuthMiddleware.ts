import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    departmentid: number | null;
    isglobalrole: boolean;
  };
}

export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ message: '未提供令牌' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number };
    const user = await User.findByPk(decoded.id);

    if (!user) {
      res.status(401).json({ message: '无效的令牌' });
      return;
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      departmentid: user.departmentid,
      isglobalrole: user.isglobalrole,
    };

    next(); // Pass control to the next middleware
  } catch (error) {
    res.status(401).json({ message: '身份验证失败' });
  }
};
