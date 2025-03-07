import express, { Request, Response, Application } from 'express';
import dotenv from 'dotenv';
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

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS Configuration
app.use(
  cors({
    origin: ['http://localhost:3000', 'https://readily-hip-leech.ngrok-free.app'],
    credentials: true, // Allow cookies/auth headers
  })
);

// ✅ Serve Static Files
app.use(express.static('public'));

// ✅ Middleware Setup
app.use(express.json()); // Replaces bodyParser.json()
app.use(express.urlencoded({ extended: true })); // Replaces bodyParser.urlencoded()

// ✅ Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/procurements', procurementRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/wecom-callback', weComCallbackRoutes);
app.use('/api/wecom-auth', weComAuthRoutes);

// ✅ Root Endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Hospital ERP System API Running 🚀' });
});

// ✅ Error Handler Middleware
app.use(errorHandler);

// ✅ Start Server
app.listen(PORT, () => {
  LoggerService.info(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

export default app; // Useful for testing
