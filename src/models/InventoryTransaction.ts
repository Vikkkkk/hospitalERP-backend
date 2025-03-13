import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import Inventory from './Inventory';
import Department from './Department';
import User from './User';

// ✅ Define ENUM as a constant array (Easier to modify later)
const TRANSACTION_TYPES = ['Transfer', 'Usage', 'Restocking'] as const;

interface InventoryTransactionAttributes {
  id: number;
  itemname: string;
  category: string;
  inventoryid: number;
  departmentId: number | null;
  transactiontype: typeof TRANSACTION_TYPES[number]; // ✅ Type-safe ENUM usage
  quantity: number;
  performedby: number | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date; // ✅ Soft delete field
}

interface InventoryTransactionCreationAttributes
  extends Optional<InventoryTransactionAttributes, 'id' | 'departmentId' | 'performedby' | 'deletedAt'> {}

export class InventoryTransaction
  extends Model<InventoryTransactionAttributes, InventoryTransactionCreationAttributes>
  implements InventoryTransactionAttributes
{
  public id!: number;
  public itemname!: string;
  public category!: string;
  public inventoryid!: number;
  public departmentId!: number | null;
  public transactiontype!: typeof TRANSACTION_TYPES[number]; // ✅ Ensures transaction type is strictly enforced
  public quantity!: number;
  public performedby!: number | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date; // ✅ Enables soft delete
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
      onDelete: 'CASCADE', // ✅ If an inventory item is deleted, remove associated transactions
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Department,
        key: 'id',
      },
      onDelete: 'CASCADE', // ✅ Ensure consistency when departments are removed
    },
    transactiontype: {
      type: DataTypes.ENUM(...TRANSACTION_TYPES), // ✅ Future-proof ENUM
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
      onDelete: 'SET NULL', // ✅ Keeps historical records even if user is deleted
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
    timestamps: true, // ✅ Auto-manage `createdAt` & `updatedAt`
    paranoid: true, // ✅ Enables soft deletion (records are "deleted" by setting `deletedAt`)
    indexes: [
      { fields: ['inventoryid'] }, // ✅ Faster lookup for inventory history
      { fields: ['transactiontype'] },
      { fields: ['performedby'] },
    ],
  }
);

// ✅ Define Associations (with unique aliases)
InventoryTransaction.belongsTo(Inventory, {
  foreignKey: 'inventoryid',
  as: 'transactionInventory', // 🔥 Updated alias to prevent conflicts
});

InventoryTransaction.belongsTo(Department, {
  foreignKey: 'departmentId',
  as: 'transactionDepartment', // 🔥 Updated alias to prevent conflicts
});

InventoryTransaction.belongsTo(User, {
  foreignKey: 'performedby',
  as: 'transactionUser', // 🔥 Updated alias to prevent conflicts
});

export default InventoryTransaction;