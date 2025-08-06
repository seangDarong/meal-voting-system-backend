import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false // ← Allow self-signed certs (dev only)
    }
});

// Verify email configuration on startup
transporter.verify(function(error, success) {
    if (error) {
        console.log('Email configuration error:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

export const sendVerificationEmail = async (email, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: 'Verify Your Email Address',
        html: `
            <h1>Registration Verification</h1>
            <p>Please click the link below to verify your email address:</p>
            <table role="presentation" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td bgcolor="#429818" align="center" style="border-radius: 4px;">
                  <a href="${verificationUrl}"
                     target="_blank"
                     style="font-size: 16px; font-family: sans-serif; color: #ffffff; text-decoration: none; padding: 12px 24px; display: inline-block;">
                    Verify Email
                  </a>
                </td>
              </tr>
            </table>
            <p>This link will expire in 24 hours.</p>
            <p>If you did not create an account, please ignore this email.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Verification email sent successfully to:', email);
    } catch (error) {
        console.error('Error sending email:', error);
        if (error.code === 'EAUTH') {
            throw new Error('Email authentication failed. Please check your email credentials.');
        }
        throw new Error('Failed to send verification email');
    }
};

export const sendPasswordResetEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: 'Password Reset Request - Meal Voting System',
        html: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #429818; text-align: center;">Password Reset Request</h2>
                <p>Hello user,</p>
                <p>We received a request to reset your password for your Meal Voting System account.</p>
                <p>Click the button below to reset your password:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                        <tr>
                            <td bgcolor="#429818" align="center" style="border-radius: 6px;">
                                <a href="${resetUrl}"
                                   target="_blank"
                                   style="font-size: 16px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 14px 28px; display: inline-block; border-radius: 6px;">
                                    Reset Password
                                </a>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <p><strong>Important Security Information:</strong></p>
                <ul style="color: #666; font-size: 14px;">
                    <li>This reset link will expire in <strong>24 hours</strong></li>
                    <li>The link can only be used <strong>once</strong></li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>Your password will remain unchanged until you click the link above</li>
                </ul>
                
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Reset password email sent successfully to:', email);
    } catch (error) {
        console.error('Error sending email:', error);
        if (error.code === 'EAUTH') {
            throw new Error('Email authentication failed. Please check your email credentials.');
        }
        throw new Error('Failed to send reset password email');
    }
};