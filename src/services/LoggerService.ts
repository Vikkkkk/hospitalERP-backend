import fs from 'fs';
import path from 'path';
import util from 'util';

/**
 * 📝 Logger Service - Centralized logging utility.
 * - Logs messages to a file (`logs/application.log`) and the console.
 * - Supports INFO, WARN, and ERROR levels.
 * - Handles log rotation (optional).
 */
export class LoggerService {
  private static logFilePath = path.join(__dirname, '../../logs/application.log');
  private static maxLogSize = 5 * 1024 * 1024; // 5MB log rotation limit (optional)

  /**
   * ✅ Log information
   */
  static info(message: string, data: any = null): void {
    this.writeLog('INFO', message, data);
  }

  /**
   * ⚠️ Log warnings
   */
  static warn(message: string, data: any = null): void {
    this.writeLog('WARN', message, data);
  }

  /**
   * ❌ Log errors
   */
  static error(message: string, data: any = null): void {
    this.writeLog('ERROR', message, data);
  }

  /**
   * 🔍 Write logs to file with timestamp
   * - Writes logs asynchronously for better performance.
   * - Supports log rotation if the file exceeds `maxLogSize`.
   */
  private static async writeLog(level: string, message: string, data: any = null): Promise<void> {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}${data ? ` | Data: ${util.inspect(data)}` : ''}\n`;

    // 🌐 Console logging (development mode)
    if (process.env.NODE_ENV !== 'production') {
      console.log(logMessage);
    }

    try {
      await this.rotateLogs(); // Ensure log rotation before writing
      await fs.promises.appendFile(this.logFilePath, logMessage);
    } catch (err) {
      console.error('❌ Failed to write to log file:', err);
    }
  }

  /**
   * 🔄 Log Rotation (Prevent infinite file growth)
   * - If the log file exceeds `maxLogSize`, it renames and creates a new log file.
   */
  private static async rotateLogs(): Promise<void> {
    try {
      const stats = await fs.promises.stat(this.logFilePath);
      if (stats.size > this.maxLogSize) {
        const rotatedLogPath = `${this.logFilePath.replace('.log', '')}-${Date.now()}.log`;
        await fs.promises.rename(this.logFilePath, rotatedLogPath);
        console.info(`♻️ Log rotated: ${rotatedLogPath}`);
      }
    } catch (err) {
      // ✅ Ensure `err` is an object and has `code`
      if (typeof err === 'object' && err !== null && 'code' in err) {
        const errorCode = (err as { code: string }).code; // ✅ Explicitly define type
        if (errorCode !== 'ENOENT') {
          console.error('⚠️ Log rotation failed:', err);
        }
      } else {
        console.error('⚠️ Unexpected error in log rotation:', err);
      }
    }
  }
}