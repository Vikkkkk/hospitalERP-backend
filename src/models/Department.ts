// backend-api/src/models/Department.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';


interface DepartmentAttributes {
  id: number;
  name: string;
  headId?: number | null; // ✅ Add headId field
  createdAt?: Date;
  updatedAt?: Date;
}

interface DepartmentCreationAttributes
  extends Optional<DepartmentAttributes, 'id' | 'headId' | 'createdAt' | 'updatedAt'> {}

export class Department extends Model<DepartmentAttributes, DepartmentCreationAttributes>
  implements DepartmentAttributes {
  public id!: number;
  public name!: string;
  public headId!: number | null; // ✅ Add headId property
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Department.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    headId: { // ✅ Add headId to the schema
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users', // Reference the Users table
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Department',
    tableName: 'Departments',
    timestamps: true,
    paranoid: true,
  }
);

export default Department;