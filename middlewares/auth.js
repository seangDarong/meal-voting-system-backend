import jwt from 'jsonwebtoken';
import db from '../models/index.js';

const User = db.User;

export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access token required. Please provide a valid Authorization header.'
        });
    }

    try {
        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch user from database to get latest info and verify user exists
        const user = await User.findByPk(decoded.id, {
            attributes: ['id', 'email', 'role', 'isVerified', 'isActive', 'createdAt', 'updatedAt']
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found. Token may be invalid.'
            });
        }

        // Check if user is verified (unverified users cannot access protected routes)
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                error: 'Email verification required. Please verify your email address to access this resource.',
                needsVerification: true
            });
        }

        // Check if user is active (deactivated users cannot access protected routes)
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                error: 'Account has been deactivated. Please contact administrator or reactivate your account.',
                accountDeactivated: true,
                reactivationInfo: user.role === 'voter' ? 
                    'Register again with your email to reactivate your account.' : 
                    'Contact an administrator to reactivate your account.'
            });
        }

        // Attach user info to request context
        req.user = user;
        next();

    } catch (err) {
        console.error('JWT verification error:', err);
        
        // Handle specific JWT errors
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token has expired. Please log in again.',
                tokenExpired: true
            });
        } else if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token format. Please provide a valid token.',
                invalidToken: true
            });
        } else {
            return res.status(401).json({
                success: false,
                error: 'Token verification failed. Please log in again.'
            });
        }
    }
};