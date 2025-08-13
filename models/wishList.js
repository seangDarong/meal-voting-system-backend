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
    },
    lastModified: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    }
}, {
    timestamps: true
});

export default WishList;