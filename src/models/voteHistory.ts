import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/db';

// Define interface for VoteHistory attributes
interface VoteHistoryAttributes {
  id?: number;
  votedDate: Date;
  userId?: string;
  dishId?: number;
  votePollId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for VoteHistory creation attributes
interface VoteHistoryCreationAttributes extends Optional<VoteHistoryAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Define VoteHistory model class
class VoteHistory extends Model<VoteHistoryAttributes, VoteHistoryCreationAttributes> implements VoteHistoryAttributes {
  public id!: number;
  public votedDate!: Date;
  public userId!: string | undefined;
  public dishId!: number | undefined;
  public votePollId!: number | undefined;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

VoteHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    votedDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    dishId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    votePollId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, 
  {
    sequelize,
    modelName: 'VoteHistory',
    tableName: 'VoteHistories',
    timestamps: true,
  }
);

export default VoteHistory;
export type { VoteHistoryAttributes, VoteHistoryCreationAttributes };