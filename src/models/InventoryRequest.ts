import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Department } from './Department';

interface InventoryRequestAttributes {
  id: number;
  requestedBy: number;
  departmentId: number;
  itemName: string;
  quantity: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Restocking' | 'Procurement'|'Completed';
  createdAt?: Date;
  updatedAt?: Date;
}

interface InventoryRequestCreationAttributes
  extends Optional<InventoryRequestAttributes, 'id' | 'status'> {}

export class InventoryRequest
  extends Model<InventoryRequestAttributes, InventoryRequestCreationAttributes>
  implements InventoryRequestAttributes {
  public id!: number;
  public requestedBy!: number;
  public departmentId!: number;
  public itemName!: string;
  public quantity!: number;
  public status!: 'Pending' | 'Approved' | 'Rejected' | 'Restocking' | 'Procurement'|'Completed';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize InventoryRequest model
InventoryRequest.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Department,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    itemName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Restocking', 'Procurement','Completed'),
      allowNull: false,
      defaultValue: 'Pending',
    },
  },
  {
    sequelize,
    modelName: 'InventoryRequest',
    tableName: 'InventoryRequests',
    timestamps: true,
  }
);


export default InventoryRequest;