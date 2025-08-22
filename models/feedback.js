import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Feedback = sequelize.define('Feedback', {
    canteen: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    system: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    content: {
        type: DataTypes.STRING,
        allowNull: true
    },
});

export default Feedback;