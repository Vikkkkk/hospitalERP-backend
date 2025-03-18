// backend-api/src/models/InventoryBatch.ts

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Inventory } from './Inventory';

interface InventoryBatchAttributes {
  id: number;
  itemId: number;
  quantity: number;
  expiryDate: Date | null;
  supplier: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface InventoryBatchCreationAttributes extends Optional<InventoryBatchAttributes, 'id' | 'expiryDate' | 'supplier'> {}

export class InventoryBatch extends Model<InventoryBatchAttributes, InventoryBatchCreationAttributes>
  implements InventoryBatchAttributes {
  public id!: number;
  public itemId!: number;
  public quantity!: number;
  public expiryDate!: Date | null;
  public supplier!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// ✅ Initialize InventoryBatch Model
InventoryBatch.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    itemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Inventory,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    expiryDate: {
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
    modelName: 'InventoryBatch',
    tableName: 'InventoryBatches',
    timestamps: true,
  }
);

export default InventoryBatch;