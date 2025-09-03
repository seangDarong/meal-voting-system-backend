import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/db';

// Define interface for CandidateDishHistory attributes
interface CandidateDishHistoryAttributes {
  id?: number;
  voteCount: number;
  isSelected: boolean;
  votePollId?: number;
  dishId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for CandidateDishHistory creation attributes
interface CandidateDishHistoryCreationAttributes extends Optional<CandidateDishHistoryAttributes, 'id' | 'voteCount' | 'isSelected' | 'createdAt' | 'updatedAt'> {}

// Define CandidateDishHistory model class
class CandidateDishHistory extends Model<CandidateDishHistoryAttributes, CandidateDishHistoryCreationAttributes> implements CandidateDishHistoryAttributes {
  public id!: number;
  public voteCount!: number;
  public isSelected!: boolean;
  public votePollId!: number | undefined;
  public dishId!: number | undefined;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CandidateDishHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    voteCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    isSelected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    votePollId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    dishId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, 
  {
    sequelize,
    modelName: 'CandidateDishHistory',
    tableName: 'CandidateDishHistories',
    timestamps: true,
  }
);

export default CandidateDishHistory;
export type { CandidateDishHistoryAttributes, CandidateDishHistoryCreationAttributes };