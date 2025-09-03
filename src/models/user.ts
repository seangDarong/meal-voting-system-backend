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
export default class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  // Use `declare` so no JS fields are emitted (prevents shadowing)
  declare id: string;
  declare email: string;
  declare password: string | null;
  declare role: 'voter' | 'staff' | 'admin';
  declare isActive: boolean;
  declare expectedGraduationDate: Date | null;
  declare microsoftId: string | null;
  declare googleId: string | null;
  declare displayName: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: true },
    role: { type: DataTypes.ENUM('voter', 'staff', 'admin'), allowNull: false, defaultValue: 'voter' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    expectedGraduationDate: { type: DataTypes.DATE, allowNull: true },
    microsoftId: { type: DataTypes.STRING, allowNull: true },
    googleId: { type: DataTypes.STRING, allowNull: true },
    displayName: { type: DataTypes.STRING, allowNull: true },
  },
  { sequelize, modelName: 'User', tableName: 'Users' }
);


export type { UserAttributes, UserCreationAttributes };