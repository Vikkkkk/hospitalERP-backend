import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL as string, {
  dialect: 'postgres',
  logging: false, // Set true for debugging SQL queries
  dialectOptions: {
    ssl: false, // Set to true if using SSL
  },
});

export { sequelize };