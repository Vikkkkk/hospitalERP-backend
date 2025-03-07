import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './middlewares/ErrorHandler';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// ✅ Enable CORS (must be placed before routes)
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://192.168.50.144:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

// ✅ Enable JSON parsing (Replaces bodyParser.json())
app.use(express.json());

// ✅ Mount API Routes
app.use('/api', routes);

// ✅ Centralized Error Handling Middleware
app.use(errorHandler);

export default app; // Use ES module export
