// backend-api/src/models/Inventory.ts

import { DataTypes, Model, Optional,HasManyGetAssociationsMixin } from 'sequelize';
import { sequelize } from '../config/database';
import { Department } from './Department';
import { InventoryBatch } from './InventoryBatch'; 

interface InventoryAttributes {
  id: number;
  itemname: string;
  category: 'Medical Supply' | 'Drug' | 'Office Supply' | 'Equipment' | 'General'; // ✅ Categorized inventory
  unit: string; // ✅ Unit of measurement (e.g., "box", "ml", "packet")
  minimumStockLevel: number;
  restockThreshold: number; // ✅ Auto-restock triggers when quantity < threshold
  departmentId: number | null;
  lastRestocked: Date | null;
  purchaseDate: Date | null; // ✅ Track procurement date
  supplier: string | null; // ✅ Supplier information
  createdAt?: Date;
  updatedAt?: Date;
  
}

interface InventoryCreationAttributes
  extends Optional<InventoryAttributes, 'id' | 'departmentId' | 'lastRestocked' | 'purchaseDate' | 'supplier'> {}

export class Inventory extends Model<InventoryAttributes, InventoryCreationAttributes> implements InventoryAttributes {
  public id!: number;
  public itemname!: string;
  public category!: 'Medical Supply' | 'Drug' | 'Office Supply' | 'Equipment' | 'General';
  public unit!: string;
  public minimumStockLevel!: number;
  public restockThreshold!: number;
  public departmentId!: number | null;
  public lastRestocked!: Date | null;
  public purchaseDate!: Date | null;
  public supplier!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

// ✅ Declare a function to fetch batches
  public getBatches!: HasManyGetAssociationsMixin<InventoryBatch>;
  public batches?: InventoryBatch[];
}

// Initialize Inventory model
Inventory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    itemname: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('Medical Supply', 'Drug', 'Office Supply', 'Equipment', 'General'),
      allowNull: false,
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'pcs', // ✅ Default unit: pieces
    },
    minimumStockLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
    restockThreshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5, // ✅ Auto-restock when below 5
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Department,
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    lastRestocked: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    purchaseDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    supplier: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Inventory',
    tableName: 'Inventory',
    timestamps: true,
  }
);

export default Inventory;