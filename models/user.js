import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define('User', {
    id : {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    email : {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        },
        set(value) {
            // Always store email in lowercase
            this.setDataValue('email', value.toLowerCase().trim());
        }
    },
    role : {
        type : DataTypes.ENUM('admin', 'voter', 'staff'),
        allowNull: false,
        defaultValue: 'voter',
    },
    password : {
        type: DataTypes.STRING,
        allowNull: false
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isActive : {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    verificationToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    verificationExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    expectedGraduationDate: {
        type: DataTypes.DATE,
        allowNull: true
    }
});

export default User;