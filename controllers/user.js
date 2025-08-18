import db from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { sendVerificationEmail,
        sendPasswordResetEmail
        } from '../utils/emailService.js';
import WishList from '../models/wishList.js';

const User = db.User;

const SCHOOL_DOMAIN = process.env.SCHOOL_DOMAIN || '@student.cadt.edu.kh' || '@cadt.edu.kh';
const validateSchoolEmail = (email) => {
    return email.toLowerCase().endsWith(SCHOOL_DOMAIN.toLowerCase());
}

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

export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        
        const user = await User.findOne({
            where: {
                verificationToken: token,
                verificationExpires: { [Op.gt]: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({ 
                error: 'Invalid or expired verification token' 
            });
        }

        // Update user verification status
        user.isVerified = true;
        user.verificationToken = null;
        user.verificationExpires = null;

        // If this is a voter account that was deactivated, reactivate it
        if (user.role === 'voter' && !user.isActive) {
            user.isActive = true;
            await user.save();
            
            console.log(`Voter account reactivated for: ${user.email}`);
            
            return res.status(200).json({ 
                message: 'Email verified successfully and account reactivated! You can now log in.',
                reactivated: true
            });
        } else {
            await user.save();
            return res.status(200).json({ 
                message: 'Email verified successfully' 
            });
        }

    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({ error: 'Error verifying email' });
    }
};

export const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ where: { email: normalizedEmail } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ error: 'Email already verified' });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationToken = verificationToken;
        user.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await user.save();

        await sendVerificationEmail(user.email, verificationToken);

        res.status(200).json({ message: 'Verification email sent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error sending verification email' });
    }
};


export const register = async (req, res) => {
    try {
        const { email, password, generation } = req.body;
        
        // Validate required fields
        if (!email || !password || !generation) {
            return res.status(400).json({ error: 'Email, password, and generation are required' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        if (!validateSchoolEmail(normalizedEmail)) {
            return res.status(400).json({ error: 'Only school email are allowed' });
        }

        // Validate generation
        const generationNumber = parseInt(generation);
        if (isNaN(generationNumber) || generationNumber < 8) {
            return res.status(400).json({ error: 'Generation must be a number starting from 8' });
        }

        // Calculate expected graduation date based on generation
        // Formula: Generation number + 2017 = graduation year
        // Month: December (12), Day: 1
        const graduationYear = generationNumber + 2017;
        const expectedGraduationDate = new Date(graduationYear, 11, 1); // Month 11 = December (0-indexed)


        // Check if user already exists
        const existingUser = await User.findOne({ where: { email: normalizedEmail } });
        
        if (existingUser) {
            // CHANGED: Always show "already exists" for existing users
            if (!existingUser.isActive) {
                // User is deactivated - different messages based on role
                if (existingUser.role === 'voter') {
                    return res.status(409).json({ 
                        error: 'An account with this email already exists. If your account was deactivated, please try logging in to reactivate it.',
                        accountExists: true,
                        isDeactivated: true,
                        reactivationHint: 'Try logging in to reactivate your account'
                    });
                } else {
                    // For admin/staff: Still require admin intervention
                    return res.status(409).json({ 
                        error: 'An account with this email already exists. Your account has been deactivated. Please contact an administrator to reactivate your account.',
                        accountExists: true,
                        isDeactivated: true,
                        role: existingUser.role,
                        contactAdmin: true
                    });
                }
            } else if (existingUser.isActive) {
                // User is active - check verification status
                if (existingUser.isVerified) {
                    return res.status(409).json({ 
                        error: 'Email already in use',
                        accountExists: true 
                    });
                } else {
                    return res.status(409).json({ 
                        error: 'Email already registered. Please check your email for verification instructions or request a new verification email.',
                        accountExists: true,
                        needsVerification: true
                    });
                }
            }
        }

        // New user registration
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const user = await User.create({  
            email: normalizedEmail, 
            password: hashedPassword,
            verificationToken,
            verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            isVerified: false,
            role: 'voter', // Default role for registration
            expectedGraduationDate: expectedGraduationDate // Add graduation date
        });
        
        const wish = await WishList.create({
            userId: user.id,
            dishId: null,
        });
        console.log('WishList row created:', wish?.toJSON());

        // Send verification email
        await sendVerificationEmail(normalizedEmail, verificationToken, false); // false = not reactivation

        res.status(201).json({ 
            message: 'Registration successful! Please check your email to verify your account.',
            data: {
                userId: user.id,
                email: user.email,
                generation: generationNumber,
                expectedGraduationDate: expectedGraduationDate ? {
                    month: expectedGraduationDate.getMonth() + 1,
                    year: expectedGraduationDate.getFullYear()
                } : null
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Error registering user' });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ where: { email: normalizedEmail } });
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid credentials' 
            });
        }

        // Check if this is a Microsoft user without password
        if (user.microsoftId && !user.password) {
            return res.status(400).json({
                success: false,
                error: 'This account was created with Microsoft authentication. Please use "Sign in with Microsoft" or complete your account setup.',
                isMicrosoftAccount: true
            });
        }

        // Check password for regular users
        if (!user.password) {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid credentials' 
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid credentials' 
            });
        }

        // CHANGED: Handle deactivated voters specially
        if (!user.isActive) {
            if (user.role === 'voter') {
                // For deactivated voters: Send reactivation email
                try {
                    const verificationToken = crypto.randomBytes(32).toString('hex');
                    
                    // Update user with new reactivation token
                    user.verificationToken = verificationToken;
                    user.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
                    user.isVerified = false; // Require re-verification for reactivation
                    await user.save();

                    // Send reactivation email
                    await sendVerificationEmail(email, verificationToken, true); // true = isReactivation

                    return res.status(200).json({ 
                        success: true,
                        message: 'Your account was deactivated. A reactivation email has been sent to your email address. Please check your email and click the link to reactivate your account.',
                        reactivationEmailSent: true,
                        needsReactivation: true
                    });
                } catch (emailError) {
                    console.error('Failed to send reactivation email:', emailError);
                    return res.status(500).json({
                        success: false,
                        error: 'Failed to send reactivation email. Please try again later.'
                    });
                }
            } else {
                // For deactivated admin/staff: Still require admin intervention
                return res.status(403).json({ 
                    success: false,
                    error: 'Your account has been deactivated. Please contact an administrator to reactivate your account.',
                    accountDeactivated: true,
                    contactAdmin: true
                });
            }
        }

        // Check if user is verified (for active users)
        if (!user.isVerified) {
            return res.status(403).json({ 
                success: false,
                error: 'Please verify your email address before logging in',
                needsVerification: true
            });
        }

        // Generate JWT token for successful login
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );
        
        res.json({ 
            success: true,
            message: 'Login successful', 
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error logging in' 
        });
    }
};

export const signOut = (req, res) => {
    res.json({ message: 'Sign out successful' });
};

export const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        // Validate input
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }
        
        const normalizedEmail = email.toLowerCase().trim();
        
        if (!validateSchoolEmail(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                error: 'Only school email are allowed'
            });
        }

        // Find user by email
        const user = await User.findOne({ where: { email: normalizedEmail } });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'No account found with this email address'
            });
        }

        // Generate secure reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Store token in database
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpires;
        await user.save();

        // Send password reset email
        try {
            await sendPasswordResetEmail(user.email, resetToken);
            console.log(`Password reset email sent to: ${user.email}`);
        } catch (emailError) {
            console.error('Failed to send password reset email:', emailError);
            
            // Clear the token if email fails
            user.resetPasswordToken = null;
            user.resetPasswordExpires = null;
            await user.save();
            
            return res.status(500).json({
                success: false,
                error: 'Failed to send password reset email. Please try again.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Password reset email sent successfully. Please check your email.'
        });

    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error. Please try again later.'
        });
    }
};

export const resetPasswordWithToken = async (req, res) => {
    try {
        const { token } = req.query;
        const { newPassword } = req.body;

        // Validate input
        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Reset token is required'
            });
        }

        if (!newPassword) {
            return res.status(400).json({
                success: false,
                error: 'New password is required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters long'
            });
        }

        // Find user with valid token
        const user = await User.findOne({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: { [Op.gt]: new Date() } // Token not expired
            }
        });

        if (!user) {
            return res.status(403).json({
                success: false,
                error: 'Invalid or expired reset token'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and invalidate token
        user.password = hashedPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        console.log(`Password successfully reset for user: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'Password reset successful. You can now log in with your new password.'
        });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error. Please try again later.'
        });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id; // From JWT middleware

        // Validate input
        if (!currentPassword) {
            return res.status(400).json({
                success: false,
                error: 'Current password is required'
            });
        }

        if (!newPassword) {
            return res.status(400).json({
                success: false,
                error: 'New password is required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'New password must be at least 6 characters long'
            });
        }

        // Check if new password is different from current password
        const isSamePassword = await bcrypt.compare(newPassword, req.user.password || '');
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                error: 'New password must be different from current password'
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

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Current password is incorrect'
            });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update password in database
        user.password = hashedNewPassword;
        await user.save();

        console.log(`Password successfully changed for user: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error. Please try again later.'
        });
    }
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
        
        // Check if email is from your school domain
        if (!email.endsWith('@student.cadt.edu.kh') && !email.endsWith('@cadt.edu.kh')) {
            return done(new Error('Only school email addresses are allowed'), null);
        }
        
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

// Add this new endpoint for setting up password for Microsoft users
export const setupPasswordForMicrosoft = async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.id;
        
        // Validate password
        if (!password) {
            return res.status(400).json({ 
                error: 'Password is required' 
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ 
                error: 'Password must be at least 6 characters long' 
            });
        }
        
        // Find the user
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if user is a Microsoft user without password
        if (!user.microsoftId) {
            return res.status(400).json({ 
                error: 'This endpoint is only for Microsoft authentication users' 
            });
        }
        
        if (user.password) {
            return res.status(400).json({ 
                error: 'Password is already set for this account' 
            });
        }
        
        // Hash and set password
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        await user.save();
        
        res.json({
            message: 'Password set successfully',
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                displayName: user.displayName,
                hasPassword: true
            }
        });
        
    } catch (error) {
        console.error('Setup password error:', error);
        res.status(500).json({ error: 'Error setting password' });
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

// Add endpoint to check what setup is needed for Microsoft users
export const checkSetupNeeds = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const needsPassword = user.microsoftId && !user.password;
        const needsGraduationDate = !user.expectedGraduationDate;
        
        res.json({
            needsPassword,
            needsGraduationDate,
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                isMicrosoftUser: !!user.microsoftId,
                hasPassword: !!user.password,
                expectedGraduationDate: user.expectedGraduationDate ? {
                    month: user.expectedGraduationDate.getMonth() + 1,
                    year: user.expectedGraduationDate.getFullYear()
                } : null
            }
        });
        
    } catch (error) {
        console.error('Check setup needs error:', error);
        res.status(500).json({ error: 'Error checking setup requirements' });
    }
};