import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/db';

// Define interface for Category attributes
interface CategoryAttributes {
  id?: number;
  name: string | null;
  name_kh: string | null;
  description: string | null;
  description_kh: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for Category creation attributes
interface CategoryCreationAttributes extends Optional<CategoryAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Define Category model class
class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  public id!: number;
  public name!: string | null;
  public name_kh!: string | null;
  public description!: string | null;
  public description_kh!: string | null;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Category.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    name_kh: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description_kh: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, 
  {
    sequelize,
    modelName: 'Category',
    tableName: 'Categories',
    timestamps: true,
  }
);

export default Category;
export type { CategoryAttributes, CategoryCreationAttributes };