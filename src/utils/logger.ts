// backend-api/src/utils/logger.ts
import fs from 'fs';
import path from 'path';

const logFile = path.join(__dirname, '../../logs/app.log');

export const logger = {
  info: (message: string) => {
    console.log(`ℹ️ ${message}`);
    fs.appendFileSync(logFile, `[INFO] ${new Date().toISOString()} - ${message}\n`);
  },
  error: (message: string) => {
    console.error(`❌ ${message}`);
    fs.appendFileSync(logFile, `[ERROR] ${new Date().toISOString()} - ${message}\n`);
  },
  warn: (message: string) => {
    console.warn(`⚠️ ${message}`);
    fs.appendFileSync(logFile, `[WARN] ${new Date().toISOString()} - ${message}\n`);
  },
};



