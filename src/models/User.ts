// backend-api/src/models/User.ts
import { DataTypes, Model, Optional,Association } from 'sequelize';
import { sequelize } from '../config/database';
import * as bcrypt from 'bcrypt';
import { Department } from './Department';

interface UserAttributes {
  id: number;
  username: string;
  role: 'RootAdmin' | 'Admin' | 'DepartmentHead' | 'Staff'; // ✅ Expanded ENUM roles
  departmentId: number | null;
  password_hash: string;
  isglobalrole: boolean;
  wecom_userid: string | null;
  canAccess: string[]; // ✅ Added canAccess
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'departmentId' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'canAccess'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public role!: 'RootAdmin' | 'Admin' | 'DepartmentHead' | 'Staff';
  public departmentId!: number | null;
  public password_hash!: string;
  public isglobalrole!: boolean;
  public wecom_userid!: string | null;
  public canAccess!: string[]; // ✅ Ensure this is included
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
  // ✅ Declare the association property
  public readonly userDepartment?: Department;

  // ✅ Define Sequelize Associations
  public static associations: {
    userDepartment: Association<User, Department>;
  };

  // ✅ Password validation method
  async validPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password_hash);
  }
}


// ✅ Sequelize Model Definition
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true, // ✅ Prevent duplicate usernames
    },
    role: {
      type: DataTypes.ENUM('RootAdmin', 'Admin', 'DepartmentHead', 'Staff'), // ✅ Role validation
      allowNull: false,
      defaultValue: 'Staff', // ✅ Default role assigned if none provided
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: `Departments`,
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    isglobalrole: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    wecom_userid: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    canAccess: {  // ✅ Ensure `canAccess` is properly defined in Sequelize
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: true,
    paranoid: true, // ✅ Enables soft deletion
  }
);

// ✅ Hooks for password hashing before saving/updating user
User.beforeCreate(async (user: User) => {
  if (!user.password_hash.startsWith('$2b$')) { // ✅ Check if already hashed
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(user.password_hash, salt);
  }
});

User.beforeUpdate(async (user: User) => {
  if (user.changed('password_hash')) {
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(user.password_hash, salt);
  }
});

User.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

export default User;