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
class WishList extends Model<WishListAttributes, WishListCreationAttributes> implements WishListAttributes {
  public id!: number;
  public userId!: string;
  public dishId!: number | null;
  public lastModified!: Date | null;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WishList.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    dishId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    lastModified: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  }, 
  {
    sequelize,
    modelName: 'WishList',
    tableName: 'WishLists',
    timestamps: true,
  }
);

export default WishList;
export type { WishListAttributes, WishListCreationAttributes };