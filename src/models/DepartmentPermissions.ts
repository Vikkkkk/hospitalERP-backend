import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Department } from './Department';

interface DepartmentPermissionsAttributes {
  id: number;
  departmentId: number;
  module: string;
  canAccess: boolean;
  deletedAt?: Date | null;
}

interface DepartmentPermissionsCreationAttributes
  extends Optional<DepartmentPermissionsAttributes, 'id' | 'deletedAt'> {}

export class DepartmentPermissions
  extends Model<DepartmentPermissionsAttributes, DepartmentPermissionsCreationAttributes>
  implements DepartmentPermissionsAttributes
{
  public id!: number;
  public departmentId!: number;
  public module!: string;
  public canAccess!: boolean;
  public deletedAt?: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DepartmentPermissions.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Department,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    module: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    canAccess: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'DepartmentPermissions',
    tableName: 'DepartmentPermissions',
    timestamps: true,
    paranoid: true, // ✅ Enables soft delete
  }
);