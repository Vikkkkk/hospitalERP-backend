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
    const user = req.user as { id?: number; departmentId?: number } | undefined;
    const userId = user?.id ?? 'Unknown';
    const departmentId = user?.departmentId ?? 'Unknown';
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'Unknown';
    const logEntry = `[${timestamp}] Action: ${action} | Entity: ${entity} (ID: ${entityId}) | User: ${userId} | Department: ${departmentId} | IP: ${ipAddress} | Path: ${req.path}\n`;

    console.log(`📝 Audit: ${logEntry.trim()}`);

    // Write the log to a file
    fs.appendFile(this.auditLogFilePath, logEntry, (err) => {
      if (err) {
        console.error('❌ Failed to write audit log:', err);
      }
    });
  }
}
