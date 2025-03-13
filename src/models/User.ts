// backend-api/src/models/User.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import * as bcrypt from 'bcrypt';

interface UserAttributes {
  id: number;
  username: string;
  role: 'RootAdmin' | 'Admin' | 'DepartmentHead' | 'Staff'; // ✅ Expanded ENUM roles
  departmentId: number | null;
  password_hash: string;
  isglobalrole: boolean;
  wecom_userid: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'departmentId' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public role!: 'RootAdmin' | 'Admin' | 'DepartmentHead' | 'Staff';
  public departmentId!: number | null;
  public password_hash!: string;
  public isglobalrole!: boolean;
  public wecom_userid!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;

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
        model: `Department`,
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
  if (user.password_hash) {
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



export default User;