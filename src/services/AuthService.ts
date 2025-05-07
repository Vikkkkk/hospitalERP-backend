import { User } from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export class AuthService {
  /**
   * 🔐 Authenticate user by username & password
   */
  static async login(username: string, password: string) {
    try {
      const user = await User.findOne({ where: { username } });

      if (!user) {
        console.warn(`⚠️ 登录失败: 用户 ${username} 不存在`);
        throw new Error('用户不存在');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        console.warn(`⚠️ 登录失败: 用户 ${username} 密码无效`);
        throw new Error('无效的密码');
      }

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role,
          departmentId: user.departmentId,
          isglobalrole: user.isglobalrole,
          wecom_userid: user.wecom_userid,
          permissions: user.permissions,
        },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      console.log(`✅ 用户 ${username} 登录成功`);
      return { token, user };
    } catch (error) {
      const err = error as Error;
      console.error('❌ 登录异常:', err.message);
      throw new Error('无法登录');
    }
  }

  /**
   * 🔄 Hash plaintext password securely
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = 10;
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      const err = error as Error;
      console.error('❌ 密码加密失败:', err.message);
      throw new Error('无法加密密码');
    }
  }

  /**
   * 🔎 Validate JWT Token
   */
  static verifyToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      const err = error as Error;
      console.error('❌ Token验证失败:', err.message);
      throw new Error('Token无效或已过期');
    }
  }
}