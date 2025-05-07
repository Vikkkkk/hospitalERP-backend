import { Department } from '../models/Department';
import { User } from '../models/User';

export class DepartmentService {
  /**
   * 🔍 Fetch all departments
   */
  static async getAllDepartments() {
    try {
      const departments = await Department.findAll();
      return departments;
    } catch (error) {
      console.error('❌ 获取部门列表失败:', (error as Error).message);
      throw new Error('无法获取部门列表');
    }
  }

  /**
   * ➕ Create a new department
   */
  static async createDepartment(name: string, headId?: number | null) {
    try {
      const department = await Department.create({ name, headId: headId || null });
      return department;
    } catch (error) {
      console.error('❌ 创建部门失败:', (error as Error).message);
      throw new Error('无法创建部门');
    }
  }

  /**
   * 🔄 Update department name or head
   */
  static async updateDepartment(departmentId: number, name: string, headId?: number | null) {
    try {
      const department = await Department.findByPk(departmentId);
      if (!department) throw new Error('未找到指定的部门');

      department.name = name;
      if (headId !== undefined) {
        department.headId = headId;
      }

      await department.save();
      return department;
    } catch (error) {
      console.error('❌ 更新部门信息失败:', (error as Error).message);
      throw new Error('无法更新部门信息');
    }
  }

  /**
   * ❌ Delete a department (Soft delete)
   */
  static async deleteDepartment(departmentId: number) {
    try {
      const department = await Department.findByPk(departmentId);
      if (!department) throw new Error('未找到指定的部门');

      await department.destroy();
      return true;
    } catch (error) {
      console.error('❌ 删除部门失败:', (error as Error).message);
      throw new Error('无法删除部门');
    }
  }

  /**
   * 👥 Fetch users in a department
   */
  static async getUsersByDepartment(departmentId: number) {
    try {
      return await User.findAll({ where: { departmentId } });
    } catch (error) {
      console.error('❌ 获取部门用户失败:', (error as Error).message);
      throw new Error('无法获取部门用户');
    }
  }
}