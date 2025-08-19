import db from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Op } from 'sequelize';
import WishList from '../models/wishList.js';

const User = db.User;



// ===== USER CONTROLLER FUNCTIONS =====
// 
// Authentication Functions:
// - verifyEmail, resendVerification, register, login, signOut
// - requestPasswordReset, resetPasswordWithToken, changePassword
//
// User Management Functions:
// - deactivateOwnAccount, getOwnProfile
//
// Microsoft Authentication Functions:
// - microsoftAuthStrategy, handleMicrosoftCallback
// - setupPasswordForMicrosoft, setupGraduationDate, checkSetupNeeds
//

// ===== EMAIL VERIFICATION & BASIC AUTH =====



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

// ===== MICROSOFT AUTHENTICATION FUNCTIONS =====

// Microsoft authentication strategy function (moved from app.js)
export const microsoftAuthStrategy = async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('Microsoft Profile:', profile);
        
        const email = profile.emails[0].value.toLowerCase();
        const displayName = profile.displayName;
        const jobTitle = profile._json?.jobTitle || '';
        
        
        // Extract generation from job title
        let expectedGraduationDate = null;
        const generationMatch = jobTitle.match(/Generation\s+(\d+)/i);
        if (generationMatch) {
            const generationNumber = parseInt(generationMatch[1]);
            if (generationNumber >= 8) {
                const graduationYear = generationNumber + 2017;
                expectedGraduationDate = new Date(graduationYear, 11, 1); // December 1st
            }
        }
        
        // Check if user already exists
        let user = await User.findOne({ where: { email: email } });
        let isFirstTime = false;
        let needsPassword = false;
        
        if (user) {
            // Existing user - check if active
            if (!user.isActive) {
                if (user.role === 'voter') {
                    // Reactivate voter account
                    user.isActive = true;
                    user.isVerified = true;
                    await user.save();
                } else {
                    return done(new Error('Your account has been deactivated. Please contact an administrator.'), null);
                }
            }
            
            // Make sure existing user is verified
            if (!user.isVerified) {
                user.isVerified = true;
                await user.save();
            }
            
            // Update Microsoft ID and graduation date if not set
            if (!user.microsoftId) {
                user.microsoftId = profile.id;
                user.displayName = displayName;
                if (expectedGraduationDate && !user.expectedGraduationDate) {
                    user.expectedGraduationDate = expectedGraduationDate;
                }
                await user.save();
            }
        } else {
            // New user - create but mark as needing password
            isFirstTime = true;
            needsPassword = true;
            
            user = await User.create({
                email: email,
                password: null, // Will be set during password setup
                role: 'voter',
                isVerified: true,
                isActive: true,
                microsoftId: profile.id,
                displayName: displayName,
                expectedGraduationDate: expectedGraduationDate
            });
            
            // Create wishlist for new user
            await WishList.create({
                userId: user.id,
                dishId: null
            });
            
            console.log('New Microsoft user created:', user.id);
        }
        
        // Add flags to indicate what setup is needed
        user.isFirstTimeLogin = isFirstTime;
        user.needsPassword = needsPassword;
        user.needsGraduationDate = !expectedGraduationDate;
        
        return done(null, user);
    } catch (error) {
        console.error('Microsoft auth error:', error);
        return done(error, null);
    }
};

// Microsoft callback handler (moved from app.js)
export const handleMicrosoftCallback = async (req, res) => {
    try {
        // Generate JWT token for the user
        const token = jwt.sign(
            { 
                id: req.user.id, 
                email: req.user.email, 
                role: req.user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Check what setup is needed
        const needsPassword = req.user.needsPassword;
        const needsGraduationDate = req.user.needsGraduationDate;
        
        if (needsPassword || needsGraduationDate) {
            // Redirect to setup page with appropriate flags
            const setupParams = new URLSearchParams({
                token: token,
                first_time: req.user.isFirstTimeLogin || false,
                needs_password: needsPassword || false,
                needs_graduation: needsGraduationDate || false
            });
            res.redirect(`${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/setup-account?${setupParams.toString()}`);
        } else {
            // Normal login redirect
            res.redirect(`${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/auth/callback?token=${token}&provider=microsoft`);
        }
    } catch (error) {
        console.error('Token generation error:', error);
        res.redirect(`${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/login?error=token_generation_failed`);
    }
};



// Setup graduation date (fallback for cases where jobTitle doesn't contain generation info)
export const setupGraduationDate = async (req, res) => {
    try {
        const { generation } = req.body;
        const userId = req.user.id;
        
        // Find the user
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if graduation date is already set
        if (user.expectedGraduationDate) {
            return res.status(400).json({ 
                error: 'Graduation date is already set for this account' 
            });
        }
        
        // Validate generation
        if (!generation) {
            return res.status(400).json({ 
                error: 'Generation number is required' 
            });
        }
        
        const generationNumber = parseInt(generation);
        if (isNaN(generationNumber) || generationNumber < 8) {
            return res.status(400).json({ 
                error: 'Generation must be a number starting from 8' 
            });
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

