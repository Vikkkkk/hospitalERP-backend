// backend-api/src/models/User.ts
import { DataTypes, Model, Optional} from 'sequelize';
import { sequelize } from '../config/database';
import { Department } from './Department';
import * as bcrypt from 'bcrypt';

interface UserAttributes {
  id: number;
  username: string;
  role: string;
  departmentid: number | null;
  password_hash: string;
  isglobalrole: boolean;
  wecom_userid: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date; // ✅ Added for soft deletion
}

interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'departmentid' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes {
  public id!: number;
  public username!: string;
  public role!: string;
  public departmentid!: number | null;
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
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    departmentid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Department,
        key: 'id',
      },
    },
    password_hash: {  // ✅ Renamed from `password`
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
    deletedAt: { // ✅ Added to support soft delete
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
  if (user.password_hash) {
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(user.password_hash, salt);
  }
});

export default User;
