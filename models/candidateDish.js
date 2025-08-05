import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const CandidateDish = sequelize.define('CandidateDish', {
    isSelected : {
        type: DataTypes.BOOLEAN,
        defaultValue : false
    }
});

export default CandidateDish;