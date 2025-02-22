const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const routes = require('./routes');
const { sequelize } = require('./models/index');
const { errorHandler } = require('./middlewares/errorHandler');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(bodyParser.json());

// Connect all routes
app.use('/api', routes);

// Error Handling Middleware
app.use(errorHandler);

// Test route
app.get('/', (req, res) => {
  res.send('Hospital ERP System is Running');
});

// Start server
const PORT = process.env.PORT || 3000;
sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});