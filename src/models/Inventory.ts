import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// Define the attributes for the Inventory model
export interface InventoryAttributes {
  id: number;
  itemName: string;
  quantity: number;
  departmentId?: number | null;
  minimumStockLevel: number;
  lastRestocked?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Attributes required when creating a new inventory entry
export interface InventoryCreationAttributes
  extends Optional<InventoryAttributes, 'id' | 'departmentId' | 'lastRestocked' | 'createdAt' | 'updatedAt'> {}

// Sequelize model definition for Inventory
export class Inventory
  extends Model<InventoryAttributes, InventoryCreationAttributes>
  implements InventoryAttributes {
  public id!: number;
  public itemName!: string;
  public quantity!: number;
  public departmentId?: number | null;
  public minimumStockLevel!: number;
  public lastRestocked!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the Inventory model with Sequelize
Inventory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    itemName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Null means it belongs to the main warehouse
    },
    minimumStockLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10, // Trigger restocking if quantity falls below this level
    },
    lastRestocked: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Inventory',
  }
);
