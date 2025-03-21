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
  permissions: {
    [module: string]: {
      read: boolean;
      write: boolean;
    };
  };
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'departmentId' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'permissions'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public role!: 'RootAdmin' | 'Admin' | 'DepartmentHead' | 'Staff';
  public departmentId!: number | null;
  public password_hash!: string;
  public isglobalrole!: boolean;
  public wecom_userid!: string | null;
  public permissions!: {
    [module: string]: {
      read: boolean;
      write: boolean;
    };
  };
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
      unique: true,
    },
    role: {
      type: DataTypes.ENUM('RootAdmin', 'Admin', 'DepartmentHead', 'Staff'),
      allowNull: false,
      defaultValue: 'Staff',
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Departments',
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
    permissions: {
      type: DataTypes.JSONB,  // 🔄 Use JSONB for PostgreSQL efficiency
      allowNull: false,
      defaultValue: {},
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
    paranoid: true,
  }
);

// 🧂 Hash Password Before Save
User.beforeCreate(async (user: User) => {
  if (!user.password_hash.startsWith('$2b$')) {
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