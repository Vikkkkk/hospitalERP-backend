import { Request } from 'express';
import fs from 'fs';
import path from 'path';

/**
 * 🔍 Audit Trail Service
 * Records critical actions performed by users for traceability.
 */
export class AuditTrailService {
  private static auditLogFilePath = path.join(__dirname, '../../logs/audit-trail.log');

  /**
   * 📋 Record an audit log entry
   */
  static recordAction(req: Request, action: string, entity: string, entityId: number): void {
    const timestamp = new Date().toISOString();
    const userId = req.user ? req.user.id : 'Unknown';
    const departmentId = req.user ? req.user.departmentid : 'Unknown';
    const logEntry = `[${timestamp}] User ID: ${userId}, Department ID: ${departmentId}, Action: ${action}, Entity: ${entity}, Entity ID: ${entityId}\n`;

    console.log(`📝 Audit: ${logEntry}`);

    // Write the log to a file
    fs.appendFile(this.auditLogFilePath, logEntry, (err) => {
      if (err) {
        console.error('❌ Failed to write audit log:', err);
      }
    });
  }
}
