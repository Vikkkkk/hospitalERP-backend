import { User } from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

/**
 * 🔒 Authentication Service
 */
export class AuthService {
  /**
   * 🔑 Authenticate a user by username and password
   */
  static async login(username: string, password: string) {
    try {
      const user = await User.findOne({ where: { username } });

      if (!user) {
        throw new Error('用户不存在');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('无效的密码');
      }

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role,
          departmentid: user.departmentid,
          isglobalrole: user.isglobalrole,
        },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      return { token, user };
    } catch (error) {
      console.error('❌ 登录失败:', error);
      throw new Error('无法登录');
    }
  }

  /**
   * 🔄 Hash a password before saving it to the database
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      return hashedPassword;
    } catch (error) {
      console.error('❌ 密码加密失败:', error);
      throw new Error('无法加密密码');
    }
  }

  /**
   * 🔍 Verify a JWT token
   */
  static verifyToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      console.error('❌ 无效的Token:', error);
      throw new Error('Token无效或已过期');
    }
  }
}
