// backend-api/src/controllers/DepartmentController.ts
import { Request, Response } from 'express';
import { Department } from '../models/Department';
import { User } from '../models/User';

export class DepartmentController {
  // ✅ Create a new department (Allow setting headId)
  static async createDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { name, headId } = req.body;

      if (!name) {
        res.status(400).json({ message: '部门名称不能为空' });
        return;
      }

      const existingDepartment = await Department.findOne({ where: { name } });
      if (existingDepartment) {
        res.status(400).json({ message: '部门已存在' });
        return;
      }

      let departmentHead = null;
      if (headId) {
        departmentHead = await User.findByPk(headId);
        if (!departmentHead) {
          res.status(400).json({ message: '指定的部门主管无效' });
          return;
        }
      }

      const newDepartment = await Department.create({ name, headId: departmentHead ? headId : null });

      res.status(201).json({
        message: '部门创建成功',
        department: newDepartment,
      });
    } catch (error) {
      console.error('❌ 创建部门失败:', error);
      res.status(500).json({ message: '无法创建部门' });
    }
  }

  // 📋 Get all departments (Include head details)
  static async getAllDepartments(_req: Request, res: Response): Promise<void> {
    try {
      const departments = await Department.findAll({
        include: [{ model: User, as: 'head', attributes: ['id', 'username', 'role'] }],
      });

      res.status(200).json({ departments });
    } catch (error) {
      console.error('❌ 无法获取部门列表:', error);
      res.status(500).json({ message: '无法获取部门列表' });
    }
  }

  // 🔄 Update department name & head (RootAdmin or 院长)
  static async updateDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, headId } = req.body;

      const department = await Department.findByPk(id);
      if (!department) {
        res.status(404).json({ message: '未找到该部门' });
        return;
      }

      if (name) {
        department.name = name;
      }

      if (headId) {
        const departmentHead = await User.findByPk(headId);
        if (!departmentHead) {
          res.status(400).json({ message: '指定的部门主管无效' });
          return;
        }
        department.headId = headId;
      }

      await department.save();

      res.status(200).json({
        message: '部门信息已更新',
        department,
      });
    } catch (error) {
      console.error('❌ 无法更新部门信息:', error);
      res.status(500).json({ message: '无法更新部门信息' });
    }
  }

  // 🏷 Assign department head (Only by RootAdmin or 院长)
  static async assignDepartmentHead(req: Request, res: Response): Promise<void> {
    try {
      const { departmentId, headId } = req.body;

      // Check if department exists
      const department = await Department.findByPk(departmentId);
      if (!department) {
        res.status(404).json({ message: '未找到该部门' });
        return;
      }

      // Check if user exists and is eligible
      const user = await User.findByPk(headId);
      if (!user) {
        res.status(404).json({ message: '未找到该用户' });
        return;
      }

      // Ensure the user belongs to the same department
      if (user.departmentId !== department.id) {
        res.status(400).json({ message: '用户不属于此部门，无法设为部门负责人' });
        return;
      }

      // Assign head
      department.headId = headId;
      await department.save();

      res.status(200).json({ message: '部门负责人已分配', department });
    } catch (error) {
      console.error('❌ 设定部门负责人失败:', error);
      res.status(500).json({ message: '无法设定部门负责人' });
    }
  }

  // ❌ Delete a department (RootAdmin only)
  static async deleteDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const department = await Department.findByPk(id);
      if (!department) {
        res.status(404).json({ message: '未找到该部门' });
        return;
      }

      await department.destroy();
      res.status(200).json({ message: '部门已删除' });
    } catch (error) {
      console.error('❌ 无法删除部门:', error);
      res.status(500).json({ message: '无法删除部门' });
    }
  }
}