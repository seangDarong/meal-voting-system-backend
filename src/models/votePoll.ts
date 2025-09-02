import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/db';
import CandidateDish  from "./candidateDish";

// Define interface for VotePoll attributes
interface VotePollAttributes {
  id?: number;
  voteDate: Date;
  mealDate: Date;
  userId: string;
  status: 'open' | 'close' | 'pending' | 'finalized';
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for VotePoll creation attributes
interface VotePollCreationAttributes extends Optional<VotePollAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

// Define VotePoll model class
class VotePoll extends Model<VotePollAttributes, VotePollCreationAttributes> implements VotePollAttributes {
  declare id: number;
  declare voteDate: Date;
  declare mealDate: Date;
  declare userId: string;
  declare status: 'open' | 'close' | 'pending' | 'finalized';

  //association 
  CandidateDishes?: CandidateDish[];
  
  // Timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

VotePoll.init( 
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    voteDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    mealDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('open', 'close', 'pending', 'finalized'),
      defaultValue: 'pending'
    }
  }, 
  {
    sequelize,
    modelName: 'VotePoll',
    tableName: 'VotePolls',
    timestamps: true,
  }
);

export default VotePoll;
export type { VotePollAttributes, VotePollCreationAttributes };