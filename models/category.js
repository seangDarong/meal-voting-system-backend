import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Category = sequelize.define('Category', {
    name: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    name_kh: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    description_kh: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

export default Category;