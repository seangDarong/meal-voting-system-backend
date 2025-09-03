import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/db';

// Define interface for CandidateDish attributes
interface CandidateDishAttributes {
  id?: number;
  votePollId: number;
  dishId: number;
  isSelected: boolean
  ;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for CandidateDish creation attributes
interface CandidateDishCreationAttributes extends Optional<CandidateDishAttributes, 'id' | 'isSelected' | 'createdAt' | 'updatedAt'> {}

// Define CandidateDish model class
class CandidateDish extends Model<CandidateDishAttributes, CandidateDishCreationAttributes> implements CandidateDishAttributes {
  declare id: number;
  declare votePollId: number;
  declare dishId: number;
  declare isSelected: boolean;
  
  // Timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CandidateDish.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    votePollId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    dishId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    isSelected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, 
  {
    sequelize,
    modelName: 'CandidateDish',
    tableName: 'CandidateDishes',
    timestamps: true,
  }
);

export default CandidateDish;
export type { CandidateDishAttributes, CandidateDishCreationAttributes };