import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const candidateDishHistory = sequelize.define('CandidateDishHistory', {
    voteCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
        isSelected : {
        type: DataTypes.BOOLEAN,
        defaultValue : false
    }
    
});

export default candidateDishHistory;