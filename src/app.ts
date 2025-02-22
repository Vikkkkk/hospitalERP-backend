import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import routes from './routes';
import { errorHandler } from './middlewares/ErrorHandler';
import cors from 'cors';


// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware setup
app.use(bodyParser.json());

// API Routes
app.use('/api', routes);

// Error handling middleware
app.use(errorHandler);

app.use(
    cors({
      origin: ['http://localhost:3000', 'http://192.168.50.144:3000'],
      methods: 'GET,POST,PUT,DELETE',
      credentials: true,
    })
  );

module.exports = app;
