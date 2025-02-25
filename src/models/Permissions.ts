// backend-api/src/models/Permissions.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Department } from './Department';

interface PermissionsAttributes {
  id: number;
  role: string;
  module: string;
  canaccess: boolean;
  departmentid?: number | null;
}

interface PermissionsCreationAttributes
  extends Optional<PermissionsAttributes, 'id' | 'departmentid'> {}

export class Permissions
  extends Model<PermissionsAttributes, PermissionsCreationAttributes>
  implements PermissionsAttributes {
  public id!: number;
  public role!: string;
  public module!: string;
  public canaccess!: boolean;
  public departmentid!: number | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize Permissions model
Permissions.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    module: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    canaccess: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    departmentid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Department,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    modelName: 'Permissions',
    tableName: 'Permissions',
    timestamps: true,
  }
);
