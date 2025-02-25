// backend-api/src/controllers/DepartmentController.ts

import { Request, Response } from 'express';
import { Department } from '../models/Department';

export class DepartmentController {
  // ✅ Create a new department (Only by RootAdmin or 院长)
  static async createDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.body;

      if (!name) {
        res.status(400).json({ message: '部门名称不能为空' });
        return;
      }

      const existingDepartment = await Department.findOne({ where: { name } });
      if (existingDepartment) {
        res.status(400).json({ message: '部门已存在' });
        return;
      }

      const newDepartment = await Department.create({ name });
      res.status(201).json({
        message: '部门创建成功',
        department: newDepartment,
      });
    } catch (error) {
      console.error('❌ 创建部门失败:', error);
      res.status(500).json({ message: '无法创建部门' });
    }
  }

  // 📋 Get all departments
  static async getAllDepartments(_req: Request, res: Response): Promise<void> {
    try {
      const departments = await Department.findAll();
      res.status(200).json({ departments });
    } catch (error) {
      console.error('❌ 无法获取部门列表:', error);
      res.status(500).json({ message: '无法获取部门列表' });
    }
  }

  // 🔄 Update department name (RootAdmin or 院长)
  static async updateDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const department = await Department.findByPk(id);
      if (!department) {
        res.status(404).json({ message: '未找到该部门' });
        return;
      }

      department.name = name;
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
