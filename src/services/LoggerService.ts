import fs from 'fs';
import path from 'path';

/**
 * 📝 Logger Service
 */
export class LoggerService {
  private static logFilePath = path.join(__dirname, '../../logs/application.log');

  /**
   * ✅ Log information
   */
  static info(message: string): void {
    this.writeLog('INFO', message);
  }

  /**
   * ⚠️ Log warnings
   */
  static warn(message: string): void {
    this.writeLog('WARN', message);
  }

  /**
   * ❌ Log errors
   */
  static error(message: string): void {
    this.writeLog('ERROR', message);
  }

  /**
   * 🔍 Write logs to file with timestamp
   */
  private static writeLog(level: string, message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;

    console.log(logMessage); // Also log to console for development

    fs.appendFile(this.logFilePath, logMessage, (err) => {
      if (err) {
        console.error('❌ Failed to write to log file:', err);
      }
    });
  }
}
