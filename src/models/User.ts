import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// Define the attributes for the User model
export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
  globalRole?: 'Admin' | 'ExecutiveVicePresident' | 'VicePresident' | 'AssistantToPresident' | null;
  departmentRole?: 'Director' | 'DeputyDirector' | 'Staff' | null;
  departmentId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Attributes required when creating a new user (id, timestamps, and roles are optional)
export interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    'id' | 'globalRole' | 'departmentRole' | 'departmentId' | 'createdAt' | 'updatedAt'
  > {}

// Sequelize model definition for User
export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
  public globalRole?: 'Admin' | 'ExecutiveVicePresident' | 'VicePresident' | 'AssistantToPresident' | null;
  public departmentRole?: 'Director' | 'DeputyDirector' | 'Staff' | null;
  public departmentId?: number | null;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize Sequelize model for User
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    globalRole: {
      type: DataTypes.ENUM('Admin', 'ExecutiveVicePresident', 'VicePresident', 'AssistantToPresident'),
      allowNull: true,
      defaultValue: null,
    },
    departmentRole: {
      type: DataTypes.ENUM('Director', 'DeputyDirector', 'Staff'),
      allowNull: true,
      defaultValue: null,
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Departments', // References the Departments table
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'User',
  }
);
