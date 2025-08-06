import db from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { sendVerificationEmail } from '../utils/emailService.js';


const SCHOOL_DOMAIN = process.env.SCHOOL_DOMAIN || '@student.cadt.edu.kh';
const validateSchoolEmail = (email) => {
    return email.toLowerCase().endsWith(SCHOOL_DOMAIN.toLowerCase());
}

const User = db.User;
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

