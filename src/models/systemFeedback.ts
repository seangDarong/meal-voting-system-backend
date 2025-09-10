import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/db';

// Define interface for SystemFeedback attributes
interface SystemFeedbackAttributes {
  id?: number;
  canteen: number | null;
  system: number | null;
  content: string | null;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for SystemFeedback creation attributes
interface SystemFeedbackCreationAttributes extends Optional<SystemFeedbackAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Define SystemFeedback model class
class SystemFeedback extends Model<SystemFeedbackAttributes, SystemFeedbackCreationAttributes> implements SystemFeedbackAttributes {
  public id!: number;
  public canteen!: number | null;
  public system!: number | null;
  public content!: string | null;
  public userId!: string | undefined;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SystemFeedback.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    canteen: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
    },
    system: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
    },
    content: {
      type: DataTypes.STRING(250),
      allowNull: true,
      validate: {
        len: [0, 250]
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true
    },
  }, 
  {
    sequelize,
    modelName: 'SystemFeedback',
    tableName: 'SystemFeedbacks',
    timestamps: true,
  }
);

export default SystemFeedback;
export type { SystemFeedbackAttributes, SystemFeedbackCreationAttributes };