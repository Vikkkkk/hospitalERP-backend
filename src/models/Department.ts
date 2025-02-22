import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// Define the attributes for the Department model
interface DepartmentAttributes {
  id: number;
  name: string;
}

interface DepartmentCreationAttributes extends Optional<DepartmentAttributes, 'id'> {}

// Sequelize model definition for Department
export class Department extends Model<DepartmentAttributes, DepartmentCreationAttributes> {
  public id!: number;
  public name!: string;

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
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    modelName: 'Department',
  }
);
