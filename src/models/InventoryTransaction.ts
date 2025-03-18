import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import Inventory from './Inventory';
import Department from './Department';
import User from './User';

// ✅ Define ENUM as a constant array (Easier to modify later)
const TRANSACTION_TYPES = ['Transfer', 'Usage', 'Restocking', 'Procurement', 'Checkout'] as const;

interface InventoryTransactionAttributes {
  id: number;
  itemname: string;
  category: string;
  inventoryid: number;
  departmentId: number | null;
  transactiontype: typeof TRANSACTION_TYPES[number];
  quantity: number;
  performedby: number | null;
  checkoutUser: number | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

interface InventoryTransactionCreationAttributes
  extends Optional<InventoryTransactionAttributes, 'id' | 'departmentId' | 'performedby' | 'checkoutUser' | 'deletedAt'> {}

export class InventoryTransaction
  extends Model<InventoryTransactionAttributes, InventoryTransactionCreationAttributes>
  implements InventoryTransactionAttributes
{
  public id!: number;
  public itemname!: string;
  public category!: string;
  public inventoryid!: number;
  public departmentId!: number | null;
  public transactiontype!: typeof TRANSACTION_TYPES[number];
  public quantity!: number;
  public performedby!: number | null;
  public checkoutUser!: number | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date;
}

InventoryTransaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    itemname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
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
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Department,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    transactiontype: {
      type: DataTypes.ENUM(...TRANSACTION_TYPES),
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
    checkoutUser: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'InventoryTransaction',
    tableName: 'InventoryTransaction',
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['inventoryid'] },
      { fields: ['transactiontype'] },
      { fields: ['performedby'] },
      { fields: ['checkoutUser'] },
    ],
  }
);

export default InventoryTransaction;