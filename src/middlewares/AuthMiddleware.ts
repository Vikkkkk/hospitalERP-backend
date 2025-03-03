import { Request, Response, NextFunction } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
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

// Securely retrieve JWT secret
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET is not set in environment variables!');
}

/**
 * 🔐 Middleware: Authenticate User via JWT
 */
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
    const decoded = jwt.verify(token, JWT_SECRET as string) as { id: number };
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
    if (error instanceof TokenExpiredError) {
      console.error('❌ 身份验证失败: 令牌已过期');
      res.status(401).json({ message: '令牌已过期' });
    } else if (error instanceof JsonWebTokenError) {
      console.error('❌ 身份验证失败: 令牌无效');
      res.status(401).json({ message: '令牌无效' });
    } else {
      const err = error as Error;
      console.error('❌ 身份验证失败:', err.message);
      res.status(401).json({ message: '身份验证失败' });
    }
  }
};
