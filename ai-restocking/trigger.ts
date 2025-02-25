// ai-restocking/trigger.ts

import { checkAndTriggerRestocking } from './restockingService';

// Function to schedule restocking checks every hour
const runRestockingScheduler = (): void => {
  console.log('⏰ 自动补货系统已启动...');

  setInterval(() => {
    console.log('🔍 检查库存水平...');
    checkAndTriggerRestocking();
  }, 60 * 60 * 1000); // Run every 1 hour
};

// Start the scheduler
runRestockingScheduler();
