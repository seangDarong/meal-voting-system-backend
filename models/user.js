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
    password: {
        type: DataTypes.STRING,
        allowNull: true, // Allow null for Microsoft auth users
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
    verificationToken: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    verificationExpires: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true,
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
    }
}, {
    timestamps: true,
});

export default User;