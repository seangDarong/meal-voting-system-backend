import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const CandidateDish = sequelize.define('CandidateDish', {
    isSelected: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
});

export default CandidateDish;