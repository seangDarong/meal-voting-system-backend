import {DataTypes} from 'sequelize';
import sequelize from '../config/db.js';

const Dish = sequelize.define('Dish',{
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    imageURL: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ingredient: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    userId: {
        type: DataTypes.UUID
    }

})

export default Dish;