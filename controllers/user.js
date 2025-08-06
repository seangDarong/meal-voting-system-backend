import db from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { Op } from 'sequelize';
import { sendVerificationEmail } from '../utils/emailService.js';

const User = db.User;

const SCHOOL_DOMAIN = process.env.SCHOOL_DOMAIN || '@student.cadt.edu.kh';
const validateSchoolEmail = (email) => {
    return email.toLowerCase().endsWith(SCHOOL_DOMAIN.toLowerCase());
}

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

        user.isVerified = true;
        user.verificationToken = null;
        user.verificationExpires = null;
        await user.save();

        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error verifying email' });
    }
};

export const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });

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
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email, and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ error: 'Email already in use' });
        }
        if (!validateSchoolEmail(email)) {
            return res.status(400).json({ error:'Only school email are allowed' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const user = await User.create({  
            email, 
            password: hashedPassword,
            verificationToken,
            verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            isVerified: false
        });

        // Send verification email
        await sendVerificationEmail(email, verificationToken);

        res.status(201).json({ 
            message: 'Registration successful! Please check your email to verify your account.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error registering user' });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Add verification check
        if (!user.isVerified) {
            return res.status(403).json({ 
                error: 'Please verify your email address before logging in',
                needsVerification: true
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ error: 'Error logging in' });
    }
};
