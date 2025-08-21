import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/db';

// Define interface for Dish attributes
interface DishAttributes {
  id?: number;
  name: string | null;
  name_kh: string | null;
  imageURL: string;
  ingredient: string | null;
  ingredient_kh: string | null;
  description: string | null;
  description_kh: string | null;
  userId: string;
  categoryId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for Dish creation attributes
interface DishCreationAttributes extends Optional<DishAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Define Dish model class
class Dish extends Model<DishAttributes, DishCreationAttributes> implements DishAttributes {
  public id!: number;
  public name!: string | null;
  public name_kh!: string | null;
  public imageURL!: string;
  public ingredient!: string | null;
  public ingredient_kh!: string | null;
  public description!: string | null;
  public description_kh!: string | null;
  public userId!: string;
  public categoryId!: number | undefined;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Dish.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    name_kh: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    imageURL: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ingredient: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ingredient_kh: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description_kh: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, 
  {
    sequelize,
    modelName: 'Dish',
    tableName: 'Dishes',
    timestamps: true,
  }
);

export default Dish;
export type { DishAttributes, DishCreationAttributes };