import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/db';

// Define interface for Feedback attributes
interface FeedbackAttributes {
  id?: number;
  content: string;
  userId?: string;
  dishId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for Feedback creation attributes
interface FeedbackCreationAttributes extends Optional<FeedbackAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Define Feedback model class
class Feedback extends Model<FeedbackAttributes, FeedbackCreationAttributes> implements FeedbackAttributes {
  public id!: number;
  public content!: string;
  public userId!: string | undefined;
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
    content: {
      type: DataTypes.STRING,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    dishId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
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