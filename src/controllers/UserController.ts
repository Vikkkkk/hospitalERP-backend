import { Request, Response } from 'express';
import { User } from '../models/User';
import { Department } from '../models/Department';
import bcrypt from 'bcrypt';

export class UserController {
  /**
   * ➕ Create a new user
   */
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { username, role, password, departmentId, isglobalrole, permissions } = req.body;

      if (!username || !role || !password) {
        res.status(400).json({ message: '请填写所有必填字段' });
        return;
      }

      const existingUser = await User.findOne({ where: { username }, paranoid: false });
      if (existingUser) {
        res.status(409).json({ message: '用户名已存在' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create({
        username,
        role,
        password_hash: hashedPassword,
        departmentId: departmentId ?? null,
        isglobalrole: !!isglobalrole,
        permissions: permissions ?? {},
      });

      res.status(201).json({ message: '用户创建成功', user: newUser });
    } catch (error) {
      console.error('❌ 创建用户失败:', error);
      res.status(500).json({ message: '无法创建用户' });
    }
  }

  /**
   * 📋 Get all users (excluding passwords)
   */
  static async getAllUsers(_req: Request, res: Response): Promise<void> {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password_hash'] },
        include: [{ model: Department, attributes: ['id', 'name'], as: 'userDepartment' }],
      });

      const formattedUsers = users.map(user => ({
        ...user.toJSON(),
        departmentName: user.userDepartment?.name ?? '无',
      }));

      res.status(200).json({ users: formattedUsers });
    } catch (error) {
      console.error('❌ 无法获取用户列表:', error);
      res.status(500).json({ message: '无法获取用户列表' });
    }
  }

  /**
   * 🔄 Update user role, department, or permissions
   */
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { role, departmentId, permissions } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        res.status(404).json({ message: '未找到用户' });
        return;
      }

      await user.update({
        role: role ?? user.role,
        departmentId: departmentId ?? user.departmentId,
        permissions: permissions ?? user.permissions,
      });

      const updatedUser = await User.findByPk(id, {
        attributes: { exclude: ['password_hash'] },
        include: [{ model: Department, attributes: ['id', 'name'], as: 'userDepartment' }],
      });

      if (!updatedUser) {
        res.status(404).json({ message: '无法获取更新后的用户' });
        return;
      }

      res.status(200).json({
        message: '用户信息已更新',
        user: {
          ...updatedUser.toJSON(),
          departmentName: updatedUser.userDepartment?.name ?? '无',
        },
      });
    } catch (error) {
      console.error('❌ 无法更新用户信息:', error);
      res.status(500).json({ message: '无法更新用户信息' });
    }
  }

  /**
   * 🔐 Reset user password
   */
  static async resetUserPassword(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        res.status(400).json({ message: '密码长度必须至少为6个字符' });
        return;
      }

      const user = await User.findByPk(id);
      if (!user) {
        res.status(404).json({ message: '未找到用户' });
        return;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await user.update({ password_hash: hashedPassword });

      res.status(200).json({ message: '用户密码已重置' });
    } catch (error) {
      console.error('❌ 无法重置密码:', error);
      res.status(500).json({ message: '无法重置用户密码' });
    }
  }

  /**
   * ❌ Soft delete a user (mark as deleted)
   */
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        res.status(404).json({ message: '未找到用户' });
        return;
      }

      await user.update({ deletedAt: new Date() });

      res.status(200).json({ message: '用户已软删除' });
    } catch (error) {
      console.error('❌ 无法删除用户:', error);
      res.status(500).json({ message: '无法删除用户' });
    }
  }
}