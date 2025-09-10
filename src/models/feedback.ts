import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/db';

// Define interface for Feedback attributes
interface FeedbackAttributes {
  id?: number;
  food: number | null;
  content: string | null;
  dishId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for Feedback creation attributes
interface FeedbackCreationAttributes extends Optional<FeedbackAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Define Feedback model class
class Feedback extends Model<FeedbackAttributes, FeedbackCreationAttributes> implements FeedbackAttributes {
  public id!: number;
  public food!: number | null;
  public content!: string | null;
  public dishId!: number | undefined;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Feedback.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    food: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    content: {
      type: DataTypes.STRING(250),
      allowNull: true,
      validate: {
        len: [0, 250]
      }

    },
  }, 
  {
    sequelize,
    modelName: 'Feedback',
    tableName: 'Feedbacks',
    timestamps: true,
  }
);

export default Feedback;
export type { FeedbackAttributes, FeedbackCreationAttributes };