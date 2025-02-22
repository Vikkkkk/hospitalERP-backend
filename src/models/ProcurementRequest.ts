import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ProcurementRequestAttributes {
  id: number;
  title: string;
  description?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Returned' | 'Completed';
  priorityLevel: 'Low' | 'Medium' | 'High';
  requestedBy: number;
  departmentId?: number | null; // Make departmentId nullable
  deadlineDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
  quantity: number; 
}

export interface ProcurementRequestCreationAttributes
  extends Optional<
    ProcurementRequestAttributes,
    'id' | 'description' | 'departmentId' | 'createdAt' | 'updatedAt'
  > {}

export class ProcurementRequest
  extends Model<ProcurementRequestAttributes, ProcurementRequestCreationAttributes>
  implements ProcurementRequestAttributes {
  public id!: number;
  public title!: string;
  public description?: string;
  public status!: 'Pending' | 'Approved' | 'Rejected' | 'Returned' | 'Completed';
  public priorityLevel!: 'Low' | 'Medium' | 'High';
  public requestedBy!: number;
  public departmentId?: number | null;
  public deadlineDate!: Date;

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
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Returned', 'Completed'),
      defaultValue: 'Pending',
    },
    priorityLevel: {
      type: DataTypes.ENUM('Low', 'Medium', 'High'),
      defaultValue: 'Medium',
    },
    requestedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow null values for departmentId
    },
    deadlineDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'ProcurementRequest',
  }
);
