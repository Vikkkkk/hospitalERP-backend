import { Request, Response, NextFunction } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { User } from '../models/User';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    departmentId: number | null;
    isglobalrole: boolean;
    wecom_userid?: string;
    canAccess: string[];  
  };
}

// ✅ Ensure JWT_SECRET is set before running the server
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('🚨 Fatal Error: JWT_SECRET is missing in environment variables! Server cannot run.');
}

/**
 * 🔎 Extracts and returns the JWT token from Authorization header
 */
const getTokenFromHeader = (req: Request): string | null => {
  const authHeader = req.header('Authorization');
  return authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null;
};

/**
 * 🔐 Middleware: Authenticate User via JWT
 */
export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = getTokenFromHeader(req);

  if (!token) {
    console.warn('⚠️ No token provided in request.');
    res.status(401).json({ message: '未提供令牌 (No token provided)' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET as string);
    console.log('🔹 Decoded Token:', decoded);

    const user = await User.findByPk((decoded as any).id);
    if (!user) {
      console.warn('🚨 Token is valid but user does not exist in database.');
      res.status(401).json({ message: '无效的令牌 (Invalid token)' });
      return;
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      departmentId: user.departmentId,
      isglobalrole: user.isglobalrole,
      wecom_userid: user.wecom_userid ?? undefined, // ✅ Converts `null` to `undefined`
      canAccess: user.canAccess || [],
    };

    console.log(`✅ User authenticated: ${user.username} (Role: ${user.role})`);
    next(); // Proceed to next middleware
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      console.error('❌ 身份验证失败: 令牌已过期 (Token expired)');
      res.status(401).json({ message: '令牌已过期 (Token expired)' });
    } else if (error instanceof JsonWebTokenError) {
      console.error(`❌ 身份验证失败: 令牌无效 (Invalid token) - ${error.message}`);
      res.status(401).json({ message: `令牌无效 (Invalid token): ${error.message}` });
    } else {
      console.error(`❌ 身份验证失败: ${(error as Error).message}`);
      res.status(401).json({ message: `身份验证失败 (Authentication failed): ${(error as Error).message}` });
    }
  }
};


// 📌 Key Features & Functions:
// AuthenticatedRequest Interface
// Extends Request to include user authentication details (e.g., id, role, wecom_userid).
// Ensures API routes receive an authenticated user's details.
// authenticateUser Middleware
// Extracts JWT token from the request header.
// Verifies & decodes the token using jsonwebtoken.
// Fetches the user from the database based on the token's id.
// Assigns user details to req.user to be accessible in subsequent middleware/controllers.
// Handles authentication errors (expired/invalid token).
