import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/db';

// Define interface for CandidateDish attributes
interface CandidateDishAttributes {
  id?: number;
  votePollId: number;
  dishId: number;
  isSelected: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for CandidateDish creation attributes
interface CandidateDishCreationAttributes extends Optional<CandidateDishAttributes, 'id' | 'isSelected' | 'createdAt' | 'updatedAt'> {}

// Define CandidateDish model class
class CandidateDish extends Model<CandidateDishAttributes, CandidateDishCreationAttributes> implements CandidateDishAttributes {
  public id!: number;
  public votePollId!: number;
  public dishId!: number;
  public isSelected!: boolean;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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