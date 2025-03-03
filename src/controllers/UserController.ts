// backend-api/src/controllers/UserController.ts

import { Request, Response } from 'express';
import { User } from '../models/User';
import bcrypt from 'bcrypt';

export class UserController {
  // ✅ Create a new user (Only by Department Heads or Admins)
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { username, role, password, departmentid, isglobalrole } = req.body;

      if (!username || !role || !password) {
        res.status(400).json({ message: '请填写所有必填字段' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        username,
        role,
        password_hash: hashedPassword,
        departmentid: departmentid || null,
        isglobalrole: isglobalrole || false,
      });

      res.status(201).json({
        message: '用户创建成功',
        user: newUser,
      });
    } catch (error) {
      console.error('❌ 创建用户失败:', error);
      res.status(500).json({ message: '无法创建用户' });
    }
  }

  // 📋 Get all users (Admin Access Only)
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await User.findAll();
      res.status(200).json({ users });
    } catch (error) {
      console.error('❌ 无法获取用户列表:', error);
      res.status(500).json({ message: '无法获取用户列表' });
    }
  }

  // 🔄 Update User Role (Admin Only)
  static async updateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        res.status(404).json({ message: '未找到用户' });
        return;
      }

      user.role = role;
      await user.save();

      res.status(200).json({ message: '用户角色已更新', user });
    } catch (error) {
      console.error('❌ 无法更新用户角色:', error);
      res.status(500).json({ message: '无法更新用户角色' });
    }
  }

  // 🔑 Reset User Password (Admin Only)
  static async resetUserPassword(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        res.status(404).json({ message: '未找到用户' });
        return;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password_hash = hashedPassword;
      await user.save();

      res.status(200).json({ message: '用户密码已重置' });
    } catch (error) {
      console.error('❌ 无法重置密码:', error);
      res.status(500).json({ message: '无法重置用户密码' });
    }
  }

  // ❌ Delete a User (RootAdmin Only)
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        res.status(404).json({ message: '未找到用户' });
        return;
      }

      await user.destroy();
      res.status(200).json({ message: '用户已删除' });
    } catch (error) {
      console.error('❌ 无法删除用户:', error);
      res.status(500).json({ message: '无法删除用户' });
    }
  }
}
