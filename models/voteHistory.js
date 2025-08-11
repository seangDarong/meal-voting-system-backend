import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const VoteHistory = sequelize.define('VoteHistory', {
    votedDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    
});

export default VoteHistory;