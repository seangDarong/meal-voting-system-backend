import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Op } from 'sequelize';
import db from '@/models/index';
import WishList from '@/models/wishList';
import { UserAttributes, UserCreationAttributes } from '@/models/user';

import { StaffLoginRequest, DeactivateOwnAccountRequest, GetOwnProfileRequest, SetupGraduationDateRequest } from '@/types/requests';
import { GoogleCallbackParameters } from 'passport-google-oauth20';

const User = db.User;

type VerifyCallback = (error: any, user?: any, info?: any) => void;

interface GoogleProfile {
  emails: Array<{ value: string }>;
  displayName: string;
  id: string;
}

interface MicrosoftProfile {
  emails: Array<{ value: string }>;
  displayName: string;
  id: string;
  _json?: {
    jobTitle?: string;
  };
}

// JWT payload interface
interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

// Extended user interface for passport
interface AuthUser extends UserAttributes {
  isFirstTimeLogin?: boolean;
  needsPassword?: boolean;
  needsGraduationDate?: boolean;
}

// Utility functions
const generateJwtToken = (user: UserAttributes): string => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
};

const validateEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

const validateGeneration = (generation: string): number => {
  const generationNumber = parseInt(generation, 10);
  if (isNaN(generationNumber) || generationNumber < 8) {
    throw new Error('Generation must be a number starting from 8');
  }
  return generationNumber;
};

const calculateGraduationDate = (generationNumber: number): Date => {
  const graduationYear = generationNumber + 2017;
  return new Date(graduationYear, 11, 1); // December 1st
};

// Main controller functions
export const staffLogin = async (req: StaffLoginRequest, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = validateEmail(email);

    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
      return res.status(401).json({ success: false, error: 'Invalid credentials or not a staff/admin account' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, error: 'Account is deactivated. Please contact an administrator.' });
    }

    if (!user.password) {
      return res.status(401).json({ success: false, error: 'No password set for this account' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = generateJwtToken(user);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        isActive: user.isActive
      }
    });
  } catch (error: any) {
    console.error('Staff login error:', error);
    return res.status(500).json({ success: false, error: 'Error logging in' });
  }
};

export const signOut = (req: Request, res: Response): Response => {
  return res.json({ message: 'Sign out successful' });
};

export const deactivateOwnAccount = async (req: DeactivateOwnAccountRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.user!.id;
    const { confirmPassword } = req.body;

    if (!confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Password confirmation is required to deactivate your account'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Your account is already deactivated'
      });
    }

    if (!user.password) {
      return res.status(401).json({
        success: false,
        error: 'No password set for this account'
      });
    }

    const isPasswordValid = await bcrypt.compare(confirmPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password. Account deactivation cancelled.'
      });
    }

    if (user.role !== 'voter') {
      return res.status(403).json({
        success: false,
        error: 'Only voter accounts can be self-deactivated. Please contact an administrator for assistance.',
        contactAdmin: true
      });
    }

    user.isActive = false;
    await user.save();

    console.log(`User ${user.email} (ID: ${user.id}) self-deactivated their account`);

    return res.status(200).json({
      success: true,
      message: 'Your account has been deactivated successfully. You can reactivate it by registering again with the same email.',
      data: {
        deactivatedAt: new Date().toISOString(),
        reactivationInfo: 'To reactivate your account, simply register again with the same email address and verify your email.'
      }
    });

  } catch (error: any) {
    console.error('Self-deactivate account error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
};

export const getOwnProfile = async (req: GetOwnProfileRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.user!.id;
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'role', 'isVerified', 'isActive', 'displayName', 'createdAt', 'updatedAt']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { user }
    });

  } catch (error: any) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
};

export const googleAuthStrategy = async (
  accessToken: string,
  refreshToken: string,
  profile: any,
  done: any
) => {
  (async () => {
    try {
      const email = validateEmail(profile.emails[0].value);
      const displayName = profile.displayName;

      let user = await User.findOne({ where: { email } });

      if (!user) {
        // Create new Google user
        user = await User.create({
          email,
          role: 'voter',
          isActive: true,
          displayName,
          googleId: profile.id,
        });

        await WishList.create({ userId: user.id, dishId: null });
      } else {
        // Update or reactivate existing user
        if (!user.isActive) {
          user.isActive = true;
          await user.save();
        }
        if (!user.googleId) {
          user.googleId = profile.id;
          user.displayName = displayName;
          await user.save();
        }
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })();
};



export const handleGoogleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error('User not found in request');
    }

    const user = req.user as AuthUser;
    const token = generateJwtToken(user);

    if (!user.expectedGraduationDate) {
      const setupParams = new URLSearchParams({
        token: token,
        needs_graduation: 'true',
        provider: 'google'
      });
      res.redirect(`${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/setup-account?${setupParams.toString()}`);
      return;
    }

    res.redirect(`${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/auth/callback?token=${token}&provider=google`);
  } catch (error: any) {
    res.redirect(`${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/login?error=token_generation_failed`);
  }
};

export const microsoftAuthStrategy = async (
  accessToken: string,
  refreshToken: string,
  profile: MicrosoftProfile,
  done: VerifyCallback
): Promise<void> => {
  try {
    const email = validateEmail(profile.emails[0].value);
    const displayName = profile.displayName;
    const jobTitle = profile._json?.jobTitle || '';
    
    let expectedGraduationDate: Date | null = null;
    const generationMatch = jobTitle.match(/Generation\s+(\d+)/i);
    
    if (generationMatch) {
      const generationNumber = parseInt(generationMatch[1], 10);
      if (generationNumber >= 8) {
        expectedGraduationDate = calculateGraduationDate(generationNumber);
      }
    }

    let user = await User.findOne({ where: { email } });
    let isFirstTime = false;
    let needsPassword = false;

    if (user) {
      if (!user.isActive) {
        if (user.role === 'voter') {
          user.isActive = true;
          await user.save();
        } else {
          return done(new Error('Your account has been deactivated. Please contact an administrator.'), null);
        }
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
      user = await User.create({
        email,
        password: null,
        role: 'voter',
        isVerified: true,
        isActive: true,
        microsoftId: profile.id,
        displayName,
        expectedGraduationDate
      } as UserCreationAttributes);
      await WishList.create({ userId: user.id, dishId: null });
    }

    // Add additional properties for passport
    (user as AuthUser).isFirstTimeLogin = isFirstTime;
    (user as AuthUser).needsPassword = needsPassword;
    (user as AuthUser).needsGraduationDate = !expectedGraduationDate;

    return done(null, user);
  } catch (error: any) {
    return done(error, null);
  }
};

export const handleMicrosoftCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error('User not found in request');
    }

    const user = req.user as AuthUser;
    const token = generateJwtToken(user);

    if (!user.expectedGraduationDate) {
      const setupParams = new URLSearchParams({
        token: token,
        needs_graduation: 'true',
        provider: 'microsoft'
      });
      res.redirect(`${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/setup-account?${setupParams.toString()}`);
      return;
    }

    res.redirect(`${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/auth/callback?token=${token}&provider=microsoft`);
  } catch (error: any) {
    res.redirect(`${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/login?error=token_generation_failed`);
  }
};

export const setupGraduationDate = async (req: SetupGraduationDateRequest, res: Response): Promise<Response> => {
  try {
    const { generation } = req.body;
    const userId = req.user!.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!generation) {
      return res.status(400).json({ error: 'Generation number is required' });
    }

    const generationNumber = validateGeneration(generation);
    const expectedGraduationDate = calculateGraduationDate(generationNumber);

    user.expectedGraduationDate = expectedGraduationDate;
    await user.save();

    return res.json({
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

  } catch (error: any) {
    console.error('Setup graduation date error:', error);
    return res.status(500).json({ error: 'Error setting graduation date' });
  }
};