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
        allowNull: true, // Password can be null for OAuth users
        validate: {
            len: [6, 100], // Minimum length for password
        },
    },
    role: {
        type: DataTypes.ENUM('admin', 'staff', 'voter'),
        allowNull: false,
        defaultValue: 'voter',
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