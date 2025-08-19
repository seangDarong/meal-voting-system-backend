import db from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Op } from 'sequelize';
import WishList from '../models/wishList.js';

const User = db.User;




export const signOut = (req, res) => {
    res.json({ message: 'Sign out successful' });
};


// ===== USER MANAGEMENT FUNCTIONS =====

export const deactivateOwnAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { confirmPassword } = req.body;

        // Validate input - require password confirmation for security
        if (!confirmPassword) {
            return res.status(400).json({
                success: false,
                error: 'Password confirmation is required to deactivate your account'
            });
        }

        // Find the user
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Check if user is already deactivated
        if (!user.isActive) {
            return res.status(400).json({
                success: false,
                error: 'Your account is already deactivated'
            });
        }

        // Verify password for security
        const isPasswordValid = await bcrypt.compare(confirmPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Incorrect password. Account deactivation cancelled.'
            });
        }

        // Only allow voters to deactivate their own accounts
        // Admin/staff should contact admin for deactivation
        if (user.role !== 'voter') {
            return res.status(403).json({
                success: false,
                error: 'Only voter accounts can be self-deactivated. Please contact an administrator for assistance.',
                contactAdmin: true
            });
        }

        // Deactivate the account
        user.isActive = false;
        await user.save();

        // Log the action
        console.log(`User ${user.email} (ID: ${user.id}) self-deactivated their account`);

        res.status(200).json({
            success: true,
            message: 'Your account has been deactivated successfully. You can reactivate it by registering again with the same email.',
            data: {
                deactivatedAt: new Date().toISOString(),
                reactivationInfo: 'To reactivate your account, simply register again with the same email address and verify your email.'
            }
        });

    } catch (error) {
        console.error('Self-deactivate account error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error. Please try again later.'
        });
    }
};

export const getOwnProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find the user and exclude sensitive information
        const user = await User.findByPk(userId, {
            attributes: ['id', 'email', 'role', 'isVerified', 'isActive', 'createdAt', 'updatedAt']
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile retrieved successfully',
            data: {
                user: user
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error. Please try again later.'
        });
    }
};

export const googleAuthStrategy = async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value.toLowerCase();
        const displayName = profile.displayName;
        let user = await db.User.findOne({ where: { email } });

        if (!user) {
            user = await db.User.create({
                email,
                role: 'voter',
                isVerified: true,
                isActive: true,
                googleId: profile.id,
                displayName
            });
            await WishList.create({ userId: user.id, dishId: null });
        } else {
            if (!user.isActive) {
                user.isActive = true;
                user.isVerified = true;
                await user.save();
            }
            if (!user.googleId) {
                user.googleId = profile.id;
                user.displayName = displayName;
                await user.save();
            }
        }
        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
};



export const handleGoogleCallback = async (req, res) => {
    try {
        const token = jwt.sign(
            { id: req.user.id, email: req.user.email, role: req.user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        // If graduation date is missing, redirect to setup page
        if (!req.user.expectedGraduationDate) {
            const setupParams = new URLSearchParams({
                token: token,
                needs_graduation: true,
                provider: 'google'
            });
            return res.redirect(`${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/setup-account?${setupParams.toString()}`);
        }
        // Otherwise, normal callback
        res.redirect(`${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/auth/callback?token=${token}&provider=google`);
    } catch (error) {
        res.redirect(`${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/login?error=token_generation_failed`);
    }
};

// MICROSOFT STRATEGY
export const microsoftAuthStrategy = async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value.toLowerCase();
        const displayName = profile.displayName;
        const jobTitle = profile._json?.jobTitle || '';
        let expectedGraduationDate = null;
        const generationMatch = jobTitle.match(/Generation\s+(\d+)/i);
        if (generationMatch) {
            const generationNumber = parseInt(generationMatch[1]);
            if (generationNumber >= 8) {
                const graduationYear = generationNumber + 2017;
                expectedGraduationDate = new Date(graduationYear, 11, 1);
            }
        }

        let user = await db.User.findOne({ where: { email } });
        let isFirstTime = false;
        let needsPassword = false;

        if (user) {
            if (!user.isActive) {
                if (user.role === 'voter') {
                    user.isActive = true;
                    user.isVerified = true;
                    await user.save();
                } else {
                    return done(new Error('Your account has been deactivated. Please contact an administrator.'), null);
                }
            }
            if (!user.isVerified) {
                user.isVerified = true;
                await user.save();
            }
            if (!user.microsoftId) {
                user.microsoftId = profile.id;
                user.displayName = displayName;
                if (expectedGraduationDate && !user.expectedGraduationDate) {
                    user.expectedGraduationDate = expectedGraduationDate;
                }
                await user.save();
            }
        } else {
            isFirstTime = true;
            needsPassword = true;
            user = await db.User.create({
                email,
                password: null,
                role: 'voter',
                isVerified: true,
                isActive: true,
                microsoftId: profile.id,
                displayName,
                expectedGraduationDate
            });
            await WishList.create({ userId: user.id, dishId: null });
        }

        user.isFirstTimeLogin = isFirstTime;
        user.needsPassword = needsPassword;
        user.needsGraduationDate = !expectedGraduationDate;

        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
};

export const handleMicrosoftCallback = async (req, res) => {
    try {
        const token = jwt.sign(
            { id: req.user.id, email: req.user.email, role: req.user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        // If graduation date is missing, redirect to setup page
        if (!req.user.expectedGraduationDate) {
            const setupParams = new URLSearchParams({
                token: token,
                needs_graduation: true,
                provider: 'microsoft'
            });
            return res.redirect(`${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/setup-account?${setupParams.toString()}`);
        }
        // Otherwise, normal callback
        res.redirect(`${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/auth/callback?token=${token}&provider=microsoft`);
    } catch (error) {
        res.redirect(`${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/login?error=token_generation_failed`);
    }
};

export const setupGraduationDate = async (req, res) => {
    try {
        const { generation } = req.body;
        const userId = req.user.id;

        // Find the user
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Validate generation
        if (!generation) {
            return res.status(400).json({ error: 'Generation number is required' });
        }

        const generationNumber = parseInt(generation);
        if (isNaN(generationNumber) || generationNumber < 8) {
            return res.status(400).json({ error: 'Generation must be a number starting from 8' });
        }

        // Calculate graduation date
        const graduationYear = generationNumber + 2017;
        const expectedGraduationDate = new Date(graduationYear, 11, 1); // December 1st

        // Update user's graduation date
        user.expectedGraduationDate = expectedGraduationDate;
        await user.save();

        res.json({
            message: 'Graduation date set successfully',
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                expectedGraduationDate: {
                    month: expectedGraduationDate.getMonth() + 1,
                    year: expectedGraduationDate.getFullYear()
                }
            }
        });

    } catch (error) {
        console.error('Setup graduation date error:', error);
        res.status(500).json({ error: 'Error setting graduation date' });
    }
};