import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AuthService } from '../services/AuthService'; // ✅ Use AuthService for login logic
import { getWeComUser } from '../services/WeComService';

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

export class AuthController {
  /**
   * 🔑 User Login (Username & Password)
   */
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

      const passwordMatch = await AuthService.login(username, password); // ✅ Call AuthService for login check
      if (!passwordMatch) {
        res.status(401).json({ message: '密码错误' });
        return;
      }

      const token = jwt.sign(
        {
          id: user.id,
          role: user.role,
          departmentId: user.departmentId,
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
          departmentId: user.departmentId,
        },
      });
    } catch (error) {
      const err = error as Error; // ✅ Typecast error for safe logging
      console.error('❌ 登录失败:', err.message);
      res.status(500).json({ message: '无法完成登录' });
    }
  }

  /**
   * 🔑 WeCom Login (SSO Integration)
   */
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
          departmentId: user.departmentId,
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
          departmentId: user.departmentId,
        },
      });
    } catch (error) {
      const err = error as Error; // ✅ Typecast error safely
      console.error('❌ WeCom 登录失败:', err.message);
      res.status(500).json({ message: 'WeCom 登录失败' });
    }
  }


/**
   * 🔄 **Update User Info (WeCom Binding & Profile Updates)**
   */
static async updateUser(req: Request, res: Response):Promise<any> {
  try {
    const { id } = (req as any).user; // Get authenticated user ID
    const { wecom_userid, username } = req.body;

    if (!id) {
      return res.status(400).json({ message: '用户 ID 无效' });
    }

    // ✅ Find the user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // ✅ Allow updates for WeCom ID & other fields
    if (wecom_userid) user.wecom_userid = wecom_userid;
    if (username) user.username = username;

    await user.save();

    res.status(200).json({
      message: '用户信息更新成功',
      user,
    });
  } catch (error) {
    console.error('❌ 用户信息更新失败:', error);
    res.status(500).json({ message: '无法更新用户信息' });
  }
}


  /**
   * 🔒 User Logout
   */
  static logout(_req: Request, res: Response): void {
    res.status(200).json({ message: '已退出登录' });
  }
}
