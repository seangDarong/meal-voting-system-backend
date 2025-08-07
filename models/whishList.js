import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const WhistList = sequelize.define('WhistList', {
    dishId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
        userId: {
        type: DataTypes.UUID
    }
});

export default WhistList;