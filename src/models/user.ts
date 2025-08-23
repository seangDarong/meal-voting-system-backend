import { DataTypes, Model, Optional, UUIDV4 } from 'sequelize';
import sequelize from '@/config/db';

interface UserAttributes {
  id: string;
  email: string;
  password: string | null;
  role: 'admin' | 'staff' | 'voter';
  isActive: boolean;
  expectedGraduationDate: Date | null;
  microsoftId: string | null;
  displayName: string | null;
  googleId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 
  'id' | 'isActive' | 'createdAt' | 'updatedAt' | 
  'password' | 'expectedGraduationDate' | 'microsoftId' | 'googleId' | 'displayName'
> {}
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password!: string | null;
  public role!: 'admin' | 'staff' | 'voter';
  public isActive!: boolean;
  public expectedGraduationDate!: Date | null;
  public microsoftId!: string | null;
  public displayName!: string | null;
  public googleId!: string | null;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true, // Password can be null for OAuth users
      validate: {
        len: [6, 100], // Minimum length for password
      },
    },
    role: {
      type: DataTypes.ENUM('admin', 'staff', 'voter'),
      allowNull: false,
      defaultValue: 'voter',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    expectedGraduationDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    microsoftId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true
    },
  }, 
  {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: true,
  }
);

export default User;

export type { UserAttributes, UserCreationAttributes };