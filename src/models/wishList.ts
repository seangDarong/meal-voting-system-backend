import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/db';

// Define interface for WishList attributes
interface WishListAttributes {
  id?: number;
  userId: string;
  dishId: number | null;
  lastModified: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for WishList creation attributes
interface WishListCreationAttributes extends Optional<WishListAttributes, 'id' | 'lastModified' | 'createdAt' | 'updatedAt'> {}

// Define WishList model class
export default class WishList extends Model<WishListAttributes, WishListCreationAttributes> implements WishListAttributes {
  declare id: string;
  declare userId: string;          // UUID string
  declare dishId: number | null;   // likely integer
  declare lastModified: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

WishList.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    dishId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    lastModified: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  { sequelize, modelName: 'WishList', tableName: 'WishLists' }
);

export type { WishListAttributes, WishListCreationAttributes };