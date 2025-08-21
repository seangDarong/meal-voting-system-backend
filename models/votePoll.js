import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const VotePoll = sequelize.define('VotePoll', {
    voteDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    mealDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
        userId: {
        type: DataTypes.UUID
    },
    status: {
        type: DataTypes.ENUM('open','close','pending','finalized'),
        defaultValue : 'pending'
    }
});

export default VotePoll;