import { Inventory } from '../models/Inventory';
import { ProcurementRequest } from '../models/ProcurementRequest';
import { User } from '../models/User';
import { Op } from 'sequelize';

/**
 * 📊 Report Service
 * Generates various reports for analysis and decision-making.
 */
export class ReportService {
  /**
   * 📦 Generate inventory status report
   */
  static async generateInventoryReport(): Promise<any> {
    try {
      const inventoryData = await Inventory.findAll();
      return inventoryData.map((item) => ({
        itemname: item.itemname,
        quantity: item.quantity,
        minimumStockLevel: item.minimumStockLevel,
        departmentId: item.departmentId,
        lastRestocked: item.lastRestocked,
      }));
    } catch (error) {
      console.error('❌ Failed to generate inventory report:', error);
      throw new Error('无法生成库存报告');
    }
  }

  /**
   * 📝 Generate procurement requests report
   */
  static async generateProcurementReport(status: string): Promise<any> {
    try {
      const procurementData = await ProcurementRequest.findAll({
        where: { status },
      });

      return procurementData.map((request) => ({
        title: request.title,
        departmentId: request.departmentId,
        quantity: request.quantity,
        status: request.status,
        deadlineDate: request.deadlinedate,
      }));
    } catch (error) {
      console.error('❌ Failed to generate procurement report:', error);
      throw new Error('无法生成采购报告');
    }
  }

  /**
   * 👥 Generate user activity report
   */
  static async generateUserActivityReport(): Promise<any> {
    try {
      const userData = await User.findAll();

      return userData.map((user) => ({
        username: user.username,
        role: user.role,
        departmentId: user.departmentId,
        globalRole: user.isglobalrole ? 'Yes' : 'No',
      }));
    } catch (error) {
      console.error('❌ Failed to generate user activity report:', error);
      throw new Error('无法生成用户活动报告');
    }
  }
}
