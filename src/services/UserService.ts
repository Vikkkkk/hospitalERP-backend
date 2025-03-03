// backend-api/src/services/UserService.ts

import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { Op } from 'sequelize';

export class UserService {
  // 🔑 Hash a password before storing it
  static async hashPassword(plainPassword: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(plainPassword, saltRounds);
  }

  // 🔍 Find a user by ID
  static async findUserById(userId: number): Promise<User | null> {
    return await User.findByPk(userId);
  }

  // 📋 List all users by department
  static async getUsersByDepartment(departmentId: number): Promise<User[]> {
    return await User.findAll({
      where: {
        departmentid: departmentId,
      },
    });
  }

  // 👥 Get users by role
  static async getUsersByRole(role: string): Promise<User[]> {
    return await User.findAll({
      where: {
        role,
      },
    });
  }

  // 🔄 Update user role
  static async updateUserRole(userId: number, newRole: string): Promise<User | null> {
    const user = await User.findByPk(userId);
    if (!user) return null;

    user.role = newRole;
    await user.save();
    return user;
  }

  // 🔐 Validate user credentials (login)
  static async validateUserCredentials(username: string, password: string): Promise<User | null> {
    const user = await User.findOne({
      where: { username },
    });

    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    return isPasswordValid ? user : null;
  }

  // 🚫 Delete user
  static async deleteUser(userId: number): Promise<boolean> {
    const user = await User.findByPk(userId);
    if (!user) return false;

    await user.destroy();
    return true;
  }

  // 🔍 Search for users by keyword (name or role)
  static async searchUsers(keyword: string): Promise<User[]> {
    return await User.findAll({
      where: {
        [Op.or]: [
          { username: { [Op.iLike]: `%${keyword}%` } },
          { role: { [Op.iLike]: `%${keyword}%` } },
        ],
      },
    });
  }
}
