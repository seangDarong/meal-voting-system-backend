import db from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const User = db.User;


export const addStaff = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Validate input
        if (!email || !password || !role) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required: email, password, role'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a valid email address'
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters long'
            });
        }

        // Validate role
        const allowedRoles = ['staff', 'admin'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Role must be either "staff" or "admin"'
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ 
            where: { email: email } 
        });
        
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'An account with this email already exists'
            });
        }

        // Hash password securely
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user with specified role and mark as verified
        const newUser = await User.create({
            email: email,
            password: hashedPassword,
            role: role,
            isVerified: true, // Auto-verify admin/staff accounts
            isActive: true
        });

        // Log the action
        console.log(`Admin ${req.user.email} created new ${role} account for: ${newUser.email}`);

        // Return success response (exclude sensitive data)
        res.status(201).json({
            success: true,
            message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`,
            data: {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
                isVerified: newUser.isVerified,
                isActive: newUser.isActive,
                createdAt: newUser.createdAt
            }
        });

    } catch (error) {
        console.error('Create staff/admin account error:', error);
        
        // Handle specific Sequelize validation errors
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                error: 'Validation failed: ' + error.errors.map(e => e.message).join(', ')
            });
        }

        res.status(500).json({
            success: false,
            error: 'Internal server error. Please try again later.'
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;

        // Validate input
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        // Prevent admin from deleting themselves
        if (id === adminId) {
            return res.status(403).json({
                success: false,
                error: 'You cannot delete your own account'
            });
        }

        // Find the user to delete
        const userToDelete = await User.findByPk(id);
        if (!userToDelete) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Store user info for logging before deletion
        const deletedUserInfo = {
            id: userToDelete.id,
            email: userToDelete.email,
            role: userToDelete.role
        };

        // Perform hard delete
        await userToDelete.destroy();

        // Log the action
        console.log(`Admin ${req.user.email} (ID: ${adminId}) permanently deleted user ${deletedUserInfo.email} (ID: ${deletedUserInfo.id}, Role: ${deletedUserInfo.role})`);

        res.status(200).json({
            success: true,
            message: 'User account has been permanently deleted',
            data: {
                deletedUser: {
                    id: deletedUserInfo.id,
                    email: deletedUserInfo.email,
                    role: deletedUserInfo.role
                },
                deletedBy: {
                    id: req.user.id,
                    email: req.user.email
                },
                deletedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Delete user error:', error);
        
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete user due to existing related records. Consider deactivating instead.'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Internal server error. Please try again later.'
        });
    }
};

export const deactivateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;

        // Validate input
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        // Prevent admin from deactivating themselves
        if (id === adminId) {
            return res.status(403).json({
                success: false,
                error: 'You cannot deactivate your own account'
            });
        }

        // Find the user to deactivate
        const userToDeactivate = await User.findByPk(id);
        if (!userToDeactivate) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Check if user is already deactivated
        if (!userToDeactivate.isActive) {
            return res.status(400).json({
                success: false,
                error: 'User account is already deactivated'
            });
        }

        // Deactivate the user (soft delete)
        userToDeactivate.isActive = false;
        await userToDeactivate.save();

        // Log the action
        console.log(`Admin ${req.user.email} (ID: ${adminId}) deactivated user ${userToDeactivate.email} (ID: ${userToDeactivate.id}, Role: ${userToDeactivate.role})`);

        res.status(200).json({
            success: true,
            message: 'User account has been deactivated successfully',
            data: {
                deactivatedUser: {
                    id: userToDeactivate.id,
                    email: userToDeactivate.email,
                    role: userToDeactivate.role,
                    isActive: userToDeactivate.isActive
                },
                deactivatedBy: {
                    id: req.user.id,
                    email: req.user.email
                },
                deactivatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Deactivate user error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error. Please try again later.'
        });
    }
};

export const reactivateUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate input
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        // Find the user to reactivate
        const userToReactivate = await User.findByPk(id);
        if (!userToReactivate) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Check if user is already active
        if (userToReactivate.isActive) {
            return res.status(400).json({
                success: false,
                error: 'User account is already active'
            });
        }

        // Only allow reactivation of admin/staff accounts (voters should use email verification)
        if (userToReactivate.role === 'voter') {
            return res.status(400).json({
                success: false,
                error: 'Voter accounts must be reactivated through email verification during registration.'
            });
        }

        // Reactivate the user
        userToReactivate.isActive = true;
        await userToReactivate.save();

        // Log the action
        console.log(`Admin ${req.user.email} (ID: ${req.user.id}) reactivated ${userToReactivate.role} user ${userToReactivate.email} (ID: ${userToReactivate.id})`);

        res.status(200).json({
            success: true,
            message: `${userToReactivate.role.charAt(0).toUpperCase() + userToReactivate.role.slice(1)} account has been reactivated successfully`,
            data: {
                reactivatedUser: {
                    id: userToReactivate.id,
                    email: userToReactivate.email,
                    role: userToReactivate.role,
                    isActive: userToReactivate.isActive
                },
                reactivatedBy: {
                    id: req.user.id,
                    email: req.user.email
                },
                reactivatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Reactivate user error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error. Please try again later.'
        });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const { includeInactive, role } = req.query;

        // Build query conditions
        const whereCondition = {};
        if (includeInactive !== 'true') {
            whereCondition.isActive = true;
        }
        if (role && ['admin', 'staff', 'voter'].includes(role)) {
            whereCondition.role = role;
        }

        // Get all users except passwords
        const users = await User.findAll({
            where: whereCondition,
            attributes: ['id', 'email', 'role', 'isVerified', 'isActive', 'createdAt', 'updatedAt'],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: 'Users retrieved successfully',
            data: {
                users,
                total: users.length,
                filters: {
                    includeInactive: includeInactive === 'true',
                    role: role || 'all'
                }
            }
        });

    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error. Please try again later.'
        });
    }
};