// backend-api/src/models/InventoryTransaction.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Inventory } from './Inventory';
import { Department } from './Department';
import { User } from './User';

interface InventoryTransactionAttributes {
  id: number;
  inventoryid: number;
  departmentid: number | null;
  transactiontype: 'Transfer' | 'Usage' | 'Restocking';
  quantity: number;
  performedby: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface InventoryTransactionCreationAttributes
  extends Optional<InventoryTransactionAttributes, 'id' | 'departmentid' | 'performedby'> {}

export class InventoryTransaction
  extends Model<InventoryTransactionAttributes, InventoryTransactionCreationAttributes>
  implements InventoryTransactionAttributes
{
  public id!: number;
  public inventoryid!: number;
  public departmentid!: number | null;
  public transactiontype!: 'Transfer' | 'Usage' | 'Restocking';
  public quantity!: number;
  public performedby!: number | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

InventoryTransaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    inventoryid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Inventory,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    departmentid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Department,
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    transactiontype: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    performedby: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
  },
  {
    sequelize,
    modelName: 'InventoryTransaction',
    tableName: 'InventoryTransaction',
    timestamps: true,
  }
);
