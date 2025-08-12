import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const WishList = sequelize.define('WishList', {
    userId: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
    },
    dishId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    }
}, {
    timestamps: true // enables createdAt and updatedAt
});

export default WishList;