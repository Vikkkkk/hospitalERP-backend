import { Router, Request, Response } from 'express';
import { InventoryTransaction } from '../models/InventoryTransaction';
import { Inventory } from '../models/Inventory';
import { authenticateUser, AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { authorizeRole } from '../middlewares/RoleCheck';
import { Op } from 'sequelize';
import { Parser } from 'json2csv';

const router = Router();

/**
 * 📊 Get Inventory Transactions (With Filtering & Pagination)
 */
router.get(
  '/',
  authenticateUser,
  authorizeRole(['RootAdmin', 'WarehouseStaff', '部长']),
  async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, type, departmentId, startDate, endDate } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const whereClause: any = {};

      if (type) whereClause.transactiontype = type;
      if (departmentId) whereClause.departmentId = departmentId;
      if (startDate && endDate) {
        whereClause.createdAt = {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
        };
      }

      const transactions = await InventoryTransaction.findAndCountAll({
        where: whereClause,
        limit: Number(limit),
        offset,
        include: [{ model: Inventory, as: 'inventory' }],
        order: [['createdAt', 'DESC']],
      });

      res.status(200).json({
        totalItems: transactions.count,
        totalPages: Math.ceil(transactions.count / Number(limit)),
        currentPage: Number(page),
        transactions: transactions.rows,
      });
    } catch (error) {
      console.error('❌ 获取库存交易日志失败:', error);
      res.status(500).json({ message: '无法获取库存交易日志' });
    }
  }
);

/**
 * 📅 Generate Monthly Inventory Report
 */
router.get(
  '/monthly-report',
  authenticateUser,
  authorizeRole(['RootAdmin', 'WarehouseStaff', '部长']),
  async (req: Request, res: Response):Promise <any> => {
    try {
      const { month, year } = req.query;

      if (!month || !year) {
        return res.status(400).json({ message: '缺少月份和年份参数' });
      }

      const startDate = new Date(`${year}-${month}-01`);
      const endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + 1);

      const transactions = await InventoryTransaction.findAll({
        where: {
          createdAt: { [Op.between]: [startDate, endDate] },
        },
        include: [{ model: Inventory, as: 'inventory' }],
      });

      // 🔹 Generate statistics
      const totalTransactions = transactions.length;
      const topUsedItems = transactions
        .filter((t) => t.transactiontype === 'Usage')
        .reduce((acc, t) => {
          acc[t.inventoryid] = (acc[t.inventoryid] || 0) + t.quantity;
          return acc;
        }, {} as Record<number, number>);

      res.status(200).json({
        month,
        year,
        totalTransactions,
        topUsedItems,
        transactions,
      });
    } catch (error) {
      console.error('❌ 获取月度库存报告失败:', error);
      res.status(500).json({ message: '无法获取月度库存报告' });
    }
  }
);

/**
 * 📤 Export Inventory Transactions as CSV
 */
router.get(
  '/export/csv',
  authenticateUser,
  authorizeRole(['RootAdmin', 'WarehouseStaff', '部长']),
  async (_req: Request, res: Response) => {
    try {
      const transactions = await InventoryTransaction.findAll({
        include: [{ model: Inventory, as: 'inventory' }],
      });

      const json2csvParser = new Parser({
        fields: ['id', 'transactiontype', 'quantity', 'performedby', 'createdAt'],
      });
      const csv = json2csvParser.parse(transactions);

      res.header('Content-Type', 'text/csv');
      res.attachment('inventory_transactions.csv');
      res.send(csv);
    } catch (error) {
      console.error('❌ 导出 CSV 失败:', error);
      res.status(500).json({ message: '无法导出 CSV' });
    }
  }
);

export default router;
