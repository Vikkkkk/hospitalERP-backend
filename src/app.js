const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');

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

module.exports = app;
