import { DataTypes, Model, Optional, Association } from 'sequelize';
import { sequelize } from '../config/database';
import { Department } from '../models/Department';
import { User } from '../models/User';

interface ProcurementRequestAttributes {
  id: number;
  title: string;
  description?: string;
  departmentId: number | null;
  requestedBy: number;
  priorityLevel: 'Low' | 'Medium' | 'High';
  deadlineDate: Date;
  quantity: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  approvalId?: string | null;
  deletedAt?: Date | null;
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
  public requestedBy!: number;
  public priorityLevel!: 'Low' | 'Medium' | 'High';
  public deadlineDate!: Date;
  public quantity!: number;
  public status!: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  public approvalId?: string | null;
  public deletedAt?: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // ✅ Association properties
  public readonly department?: Department;
  public readonly requester?: User;

  public static associations: {
    department: Association<ProcurementRequest, Department>;
    requester: Association<ProcurementRequest, User>;
  };
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
      onDelete: 'SET NULL',
    },
    requestedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    priorityLevel: {
      type: DataTypes.ENUM('Low', 'Medium', 'High'),
      allowNull: false,
      defaultValue: 'Medium',
    },
    deadlineDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Completed'),
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
    paranoid: true,
  }
);

export default ProcurementRequest;