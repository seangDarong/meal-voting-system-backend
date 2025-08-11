import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Feedback = sequelize.define('Feedback', {
    content: {
        type: DataTypes.STRING,
        allowNull: false
    },
});

export default Feedback;