import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Department } from './Department';
import { User } from './User';

interface ProcurementRequestAttributes {
  id: number;
  title: string;
  description?: string;
  departmentId: number | null;
  requestedby: number;
  prioritylevel: 'Low' | 'Medium' | 'High';
  deadlinedate: Date;
  quantity: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  approvalId?: string | null;
  deletedAt?: Date | null; // ✅ Soft deletion support
}

interface ProcurementRequestCreationAttributes
  extends Optional<ProcurementRequestAttributes, 'id' | 'description' | 'approvalId' | 'deletedAt'> {}

export class ProcurementRequest
  extends Model<ProcurementRequestAttributes, ProcurementRequestCreationAttributes>
  implements ProcurementRequestAttributes
{
  public id!: number;
  public title!: string;
  public description?: string;
  public departmentId!: number | null;
  public requestedby!: number;
  public prioritylevel!: 'Low' | 'Medium' | 'High';
  public deadlinedate!: Date;
  public quantity!: number;
  public status!: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  public approvalId?: string | null;
  public deletedAt?: Date | null; // ✅ Soft deletion support

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProcurementRequest.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Department,
        key: 'id',
      },
      onDelete: 'SET NULL', // ✅ Prevent errors if department is deleted
    },
    requestedby: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE', // ✅ Ensures cleanup if user is deleted
    },
    prioritylevel: {
      type: DataTypes.ENUM('Low', 'Medium', 'High'), // ✅ Enforce enum validation
      allowNull: false,
      defaultValue: 'Medium', // ✅ Set sensible default
    },
    deadlinedate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1, // ✅ Ensure valid quantity
      },
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Completed'), // ✅ Enforce enum validation
      allowNull: false,
      defaultValue: 'Pending',
    },
    approvalId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'ProcurementRequest',
    tableName: 'ProcurementRequests',
    timestamps: true,
    paranoid: true, // ✅ Enables soft delete
  }
);
