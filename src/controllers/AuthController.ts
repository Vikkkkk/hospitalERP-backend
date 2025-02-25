import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { getWeComUser } from '../services/WeComService'; // Fixed the import issue

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ message: '用户名和密码是必填项' });
        return;
      }

      const user = await User.findOne({ where: { username } });
      if (!user) {
        res.status(404).json({ message: '未找到用户' });
        return;
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        res.status(401).json({ message: '密码错误' });
        return;
      }

      const token = jwt.sign(
        {
          id: user.id,
          role: user.role,
          departmentid: user.departmentid,
          isglobalrole: user.isglobalrole,
        },
        SECRET_KEY,
        { expiresIn: '8h' }
      );

      res.status(200).json({
        message: '登录成功',
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          departmentid: user.departmentid,
        },
      });
    } catch (error) {
      console.error('❌ 登录失败:', error);
      res.status(500).json({ message: '无法完成登录' });
    }
  }

  static async wecomLogin(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.body;

      if (!code) {
        res.status(400).json({ message: '缺少WeCom授权码' });
        return;
      }

      const wecomUser = await getWeComUser(code);
      if (!wecomUser) {
        res.status(401).json({ message: 'WeCom认证失败' });
        return;
      }

      let user = await User.findOne({ where: { username: wecomUser.userid } });
      if (!user) {
        res.status(404).json({ message: '未找到与WeCom账户关联的用户' });
        return;
      }

      const token = jwt.sign(
        {
          id: user.id,
          role: user.role,
          departmentid: user.departmentid,
          isglobalrole: user.isglobalrole,
        },
        SECRET_KEY,
        { expiresIn: '8h' }
      );

      res.status(200).json({
        message: 'WeCom登录成功',
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          departmentid: user.departmentid,
        },
      });
    } catch (error) {
      console.error('❌ WeCom 登录失败:', error);
      res.status(500).json({ message: 'WeCom 登录失败' });
    }
  }

  static logout(_req: Request, res: Response): void {
    res.status(200).json({ message: '已退出登录' });
  }
}
