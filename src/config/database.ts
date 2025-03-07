import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('🚨 DATABASE_URL is missing in environment variables! Server cannot start.');
  process.exit(1); // Stop execution if no database connection is configured
}

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: isProduction ? false : console.log, // Enable logging in development
  dialectOptions: {
    ssl: isProduction ? { require: true, rejectUnauthorized: false } : false,
  },
});

export { sequelize };
