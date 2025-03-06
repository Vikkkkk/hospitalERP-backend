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
    wecom_userid?: string; // ✅ Include this since it's in the token
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
    const decoded = jwt.verify(token, JWT_SECRET as string);
    console.log('🔹 Decoded Token:', decoded); // ✅ Debugging log

    const user = await User.findByPk((decoded as any).id);

    if (!user) {
      res.status(401).json({ message: '无效的令牌' });
      return;
    }

    // ✅ Ensure wecom_userid is correctly assigned (null → undefined)
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      departmentid: user.departmentid,
      isglobalrole: user.isglobalrole,
      wecom_userid: user.wecom_userid ?? undefined, // ✅ Converts `null` to `undefined`
    };

    next(); // Proceed to next middleware
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      console.error('❌ 身份验证失败: 令牌已过期');
      res.status(401).json({ message: '令牌已过期' });
    } else if (error instanceof JsonWebTokenError) {
      console.error('❌ 身份验证失败: 令牌无效');
      res.status(401).json({ message: '令牌无效' });
    } else {
      console.error('❌ 身份验证失败:', (error as Error).message);
      res.status(401).json({ message: '身份验证失败' });
    }
  }
};
