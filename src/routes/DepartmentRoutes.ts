import { Router, Response } from 'express';
import { Department } from '../models/Department';
import { User } from '../models/User';
import { authenticateUser, AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { authorizeAccess } from '../middlewares/AccessMiddleware';

const router = Router();

// 📌 Create a new department (RootAdmin, Admin only)
router.post(
  '/create',
  authenticateUser,
  authorizeAccess(['RootAdmin', 'Admin']),
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ message: '部门名称是必填项' });
      }

      const existingDepartment = await Department.findOne({ where: { name } });
      if (existingDepartment) {
        return res.status(409).json({ message: '部门已存在' });
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
);

// 📌 Get all departments (All authenticated users)
router.get(
  '/',
  authenticateUser,
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const departments = await Department.findAll();
      res.status(200).json({ departments });
    } catch (error) {
      console.error('❌ 获取部门列表失败:', error);
      res.status(500).json({ message: '无法获取部门列表' });
    }
  }
);

// 📌 Update department name (RootAdmin, Admin only)
router.patch(
  '/:id',
  authenticateUser,
  authorizeAccess(['RootAdmin', 'Admin']),
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const department = await Department.findByPk(id);
      if (!department) {
        return res.status(404).json({ message: '未找到该部门' });
      }

      department.name = name || department.name;
      await department.save();

      res.status(200).json({ message: '部门信息已更新', department });
    } catch (error) {
      console.error('❌ 更新部门信息失败:', error);
      res.status(500).json({ message: '无法更新部门信息' });
    }
  }
);

// 📌 Assign department head (RootAdmin, Admin only)
router.put(
  '/assign-head',
  authenticateUser,
  authorizeAccess(['RootAdmin', 'Admin']),
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { departmentId, headId } = req.body;

      // Check if department exists
      const department = await Department.findByPk(departmentId);
      if (!department) {
        return res.status(404).json({ message: '未找到该部门' });
      }

      // Check if user exists and is eligible
      const user = await User.findByPk(headId);
      if (!user) {
        return res.status(404).json({ message: '未找到该用户' });
      }

      // Ensure the user belongs to the same department
      if (user.departmentId !== department.id) {
        return res.status(400).json({ message: '用户不属于此部门，无法设为部门负责人' });
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
);

// 📌 Delete a department (RootAdmin, Admin only)
router.delete(
  '/:id',
  authenticateUser,
  authorizeAccess(['RootAdmin', 'Admin']),
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { id } = req.params;

      const department = await Department.findByPk(id);
      if (!department) {
        return res.status(404).json({ message: '未找到该部门' });
      }

      await department.destroy();
      res.status(200).json({ message: '部门已成功删除' });
    } catch (error) {
      console.error('❌ 删除部门失败:', error);
      res.status(500).json({ message: '无法删除部门' });
    }
  }
);

export default router;