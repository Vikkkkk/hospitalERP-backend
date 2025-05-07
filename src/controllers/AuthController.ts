import { Request, Response } from 'express';
import { User } from '../models/User';
import { AuthService } from '../services/AuthService';
import { getWeComUser } from '../services/WeComService';

export class AuthController {
  /**
   * 🔑 User Login (Username & Password)
   */
  static async login(req: Request, res: Response): Promise<any> {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: '用户名和密码是必填项' });
      }

      const { token, user } = await AuthService.login(username, password);

      res.status(200).json({
        message: '登录成功',
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          departmentId: user.departmentId,
          isglobalrole: user.isglobalrole,
        },
      });
    } catch (error) {
      console.error('❌ 登录失败:', (error as Error).message);
      res.status(500).json({ message: '无法完成登录' });
    }
  }

  /**
   * 🔑 WeCom Login (SSO Integration)
   */
  static async wecomLogin(req: Request, res: Response): Promise<any> {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ message: '缺少WeCom授权码' });
      }

      const wecomUser = await getWeComUser(code);
      if (!wecomUser) {
        return res.status(401).json({ message: 'WeCom认证失败' });
      }

      const user = await User.findOne({ where: { username: wecomUser.userid } });
      if (!user) {
        return res.status(404).json({ message: '未找到与WeCom账户关联的用户' });
      }

      const token = AuthService.verifyToken(
        JSON.stringify({
          id: user.id,
          role: user.role,
          departmentId: user.departmentId,
          isglobalrole: user.isglobalrole,
        })
      );

      res.status(200).json({
        message: 'WeCom登录成功',
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          departmentId: user.departmentId,
          isglobalrole: user.isglobalrole,
        },
      });
    } catch (error) {
      console.error('❌ WeCom 登录失败:', (error as Error).message);
      res.status(500).json({ message: 'WeCom 登录失败' });
    }
  }

  /**
   * 🔄 Update User Info (e.g., WeCom Binding)
   */
  static async updateUser(req: Request, res: Response): Promise<any> {
    try {
      const { id } = (req as any).user;
      const { wecom_userid, username } = req.body;

      if (!id) {
        return res.status(400).json({ message: '用户 ID 无效' });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }

      if (wecom_userid) user.wecom_userid = wecom_userid;
      if (username) user.username = username;

      await user.save();

      res.status(200).json({ message: '用户信息更新成功', user });
    } catch (error) {
      console.error('❌ 用户信息更新失败:', error);
      res.status(500).json({ message: '无法更新用户信息' });
    }
  }

  /**
   * 🔒 Logout
   */
  static logout(_req: Request, res: Response): void {
    res.status(200).json({ message: '已退出登录' });
  }
}