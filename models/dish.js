import {DataTypes} from 'sequelize';
import sequelize from '../config/db.js';

const Dish = sequelize.define('Dish',{
    name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    name_kh: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    imageURL: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ingredient: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ingredient_kh: {
        type: DataTypes.STRING,
        allowNull: true
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    description_kh: {
        type: DataTypes.STRING,
        allowNull: true
    },
    userId: {
        type: DataTypes.UUID
    }

})

export default Dish;