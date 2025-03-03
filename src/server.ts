import express, { Request, Response, NextFunction, Application } from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import path from 'path';
import cors from 'cors';

import authRoutes from './routes/AuthRoutes';
import userRoutes from './routes/UserRoutes';
import departmentRoutes from './routes/DepartmentRoutes';
import inventoryRoutes from './routes/InventoryRoutes';
import procurementRoutes from './routes/ProcurementRoutes';
import permissionRoutes from './routes/PermissionRoutes';
import approvalRoutes from './routes/ApprovalRoutes';
import weComCallbackRoutes from './routes/WeComCallbackRoutes';
import weComAuthRoutes from './routes/WeComAuthRoutes';
import { errorHandler } from './services/ErrorService';
import { LoggerService } from './services/LoggerService';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Allow requests from frontend
app.use(cors({
  origin: ['http://localhost:3000', 'https://readily-hip-leech.ngrok-free.app'], // Adjust as needed
  credentials: true, // Allow cookies and authentication headers
}));

//Serve static files
app.use(express.static('public'))

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/procurements', procurementRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/wecom-callback', weComCallbackRoutes);
app.use('/api/wecom-auth', weComAuthRoutes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Hospital ERP System API Running 🚀' });
});

// Error handler middleware
app.use(errorHandler);

// List all available routes without TypeScript errors
console.log(
  app._router.stack
    .map((r: any) => r.route?.path)
    .filter(Boolean)
);

// Start server
app.listen(PORT, () => {
  LoggerService.info(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
