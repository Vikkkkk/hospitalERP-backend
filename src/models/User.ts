// backend-api/src/models/User.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Department } from './Department';

interface UserAttributes {
  id: number;
  username: string;
  role: string;
  departmentid: number | null;
  password: string;
  isglobalrole: boolean;
  wecom_userid: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'departmentid' | 'createdAt' | 'updatedAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes {
  public id!: number;
  public username!: string;
  public role!: string;
  public departmentid!: number | null;
  public password!: string;
  public isglobalrole!: boolean;
  public wecom_userid!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    departmentid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Department,
        key: 'id',
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    isglobalrole: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    wecom_userid: {
      type: DataTypes.STRING(50),
      allowNull: true, // 👈 Allow null because not all users will have it
      unique: true,
    }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: true,
  }
);
