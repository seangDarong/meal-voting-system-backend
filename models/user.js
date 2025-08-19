import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    role: {
        type: DataTypes.ENUM('admin', 'staff', 'voter'),
        allowNull: false,
        defaultValue: 'voter',
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    expectedGraduationDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    microsoftId: { // Add Microsoft ID field
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    displayName: { // Add display name from Microsoft
        type: DataTypes.STRING,
        allowNull: true,
    },
    googleId: {
    type: DataTypes.STRING,
    allowNull: true
    },
}, {
    timestamps: true,
});

export default User;