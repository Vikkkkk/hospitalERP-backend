// backend-api/src/models/Inventory.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Department } from './Department';

interface InventoryAttributes {
  id: number;
  itemname: string;
  quantity: number;
  minimumstocklevel: number;
  departmentid: number | null;
  lastRestocked: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface InventoryCreationAttributes
  extends Optional<InventoryAttributes, 'id' | 'departmentid' | 'lastRestocked'> {}

export class Inventory extends Model<InventoryAttributes, InventoryCreationAttributes>
  implements InventoryAttributes {
  public id!: number;
  public itemname!: string;
  public quantity!: number;
  public minimumstocklevel!: number;
  public departmentid!: number | null;
  public lastRestocked!: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    minimumstocklevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
    departmentid: {
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
  },
  {
    sequelize,
    modelName: 'Inventory',
    tableName: 'Inventory',
    timestamps: true,
  }
);

Inventory.belongsTo(Department, {
  foreignKey: 'departmentid',
  as: 'department',
});

