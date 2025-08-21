import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/db';

// Define interface for Vote attributes
interface VoteAttributes {
  id?: number;
  userId: string;
  dishId?: number;
  votePollId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for Vote creation attributes
interface VoteCreationAttributes extends Optional<VoteAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Define Vote model class
class Vote extends Model<VoteAttributes, VoteCreationAttributes> implements VoteAttributes {
  public id!: number;
  public userId!: string;
  public dishId!: number | undefined;
  public votePollId!: number | undefined;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Vote.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
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
    modelName: 'Vote',
    tableName: 'Votes',
    timestamps: true,
  }
);

export default Vote;
export type { VoteAttributes, VoteCreationAttributes };