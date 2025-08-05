import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Vote = sequelize.define('Vote', {
    userId: {
        type: DataTypes.UUID
    }
});

export default Vote;