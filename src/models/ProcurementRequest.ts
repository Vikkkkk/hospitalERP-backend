// backend-api/src/models/ProcurementRequest.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Department } from './Department';
import { User } from './User';

interface ProcurementRequestAttributes {
  id: number;
  title: string;
  description?: string;
  departmentid: number | null;
  requestedby: number;
  prioritylevel: 'Low' | 'Medium' | 'High';
  deadlinedate: Date;
  quantity: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  approvalId?: string | null;
}

interface ProcurementRequestCreationAttributes
  extends Optional<ProcurementRequestAttributes, 'id' | 'description' | 'approvalId'> {}

export class ProcurementRequest
  extends Model<ProcurementRequestAttributes, ProcurementRequestCreationAttributes>
  implements ProcurementRequestAttributes
{
  public id!: number;
  public title!: string;
  public description?: string;
  public departmentid!: number | null;
  public requestedby!: number;
  public prioritylevel!: 'Low' | 'Medium' | 'High';
  public deadlinedate!: Date;
  public quantity!: number;
  public status!: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  public approvalId?: string | null;

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
    departmentid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Department,
        key: 'id',
      },
    },
    requestedby: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    prioritylevel: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    deadlinedate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Pending',
      validate: {
        isIn: [['Pending', 'Approved', 'Rejected', 'Completed']],
      },
    },
    approvalId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'ProcurementRequest',
    tableName: 'ProcurementRequests',
    timestamps: true,
  }
);
