import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../models/index.js';
// import { UserAttributes } from '../models/user.js';

const User = db.User;

// JWT payload interface
interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Access token required. Please provide a valid Authorization header.'
    });
    return;
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    // Fetch user from database to get latest info and verify user exists
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'email', 'role', 'isActive', 'createdAt', 'updatedAt']
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found. Token may be invalid.'
      });
      return;
    }

    // Check if user is active (deactivated users cannot access protected routes)
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: 'Account has been deactivated. Please contact administrator or reactivate your account.',
        accountDeactivated: true,
        reactivationInfo: user.role === 'voter' ? 
          'Register again with your email to reactivate your account.' : 
          'Contact an administrator to reactivate your account.'
      });
      return;
    }

    // Attach user info to request context
    req.user = user;
    next();

  } catch (err: any) {
    console.error('JWT verification error:', err);
    
    // Handle specific JWT errors
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: 'Token has expired. Please log in again.',
        tokenExpired: true
      });
    } else if (err.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        error: 'Invalid token format. Please provide a valid token.',
        invalidToken: true
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Token verification failed. Please log in again.'
      });
    }
  }
};
