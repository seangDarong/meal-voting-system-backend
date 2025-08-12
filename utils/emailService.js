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

// Generate a random number for email uniqueness
const generateRandomId = () => {
    return Math.floor(Math.random() * 1000000) + 100000; // 6-digit number
};

export const sendVerificationEmail = async (email, token, isReactivation = false) => {
    const verificationUrl = `${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/verify-email?token=${token}`;
    const randomId = generateRandomId();
    
    const subject = isReactivation ? 
        'Reactivate Your Account - Meal Voting System' : 
        'Verify Your Email Address - Meal Voting System';
    
    const title = isReactivation ? 
        'Account Reactivation Required' : 
        'Email Verification Required';
    
    const message = isReactivation ? 
        'We noticed you tried to log in to your deactivated account. Click the link below to reactivate your account:' :
        'Please click the link below to verify your email address:';
    
    const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: subject,
        html: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #429818; text-align: center;">${title}</h2>
                <p>Hello,</p>
                <p>${message}</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                        <tr>
                            <td bgcolor="#429818" align="center" style="border-radius: 6px;">
                                <a href="${verificationUrl}"
                                   target="_blank"
                                   style="font-size: 16px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 14px 28px; display: inline-block; border-radius: 6px;">
                                    ${isReactivation ? 'Reactivate Account' : 'Verify Email'}
                                </a>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <p>This link will expire in 24 hours.</p>
                ${isReactivation ? 
                    '<p><strong>Note:</strong> After clicking this link, your account will be reactivated and you can log in normally.</p>' : 
                    '<p>If you did not create an account, please ignore this email.</p>'
                }
                ${isReactivation ? 
                    '<p style="color: #666; font-size: 14px;"><em>Your account was deactivated, but you can easily reactivate it by clicking the link above.</em></p>' : 
                    ''
                }
                
                <!-- Email ID for uniqueness -->
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center;">
                    <p>Email ID: ${randomId} | Meal Voting System</p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`${isReactivation ? 'Reactivation' : 'Verification'} email sent successfully to:`, email, `| Email ID: ${randomId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        if (error.code === 'EAUTH') {
            throw new Error('Email authentication failed. Please check your email credentials.');
        }
        throw new Error(`Failed to send ${isReactivation ? 'reactivation' : 'verification'} email`);
    }
};

export const sendPasswordResetEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/reset-password?token=${resetToken}`;
    const randomId = generateRandomId();
    
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
                
                <!-- Email ID for uniqueness -->
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center;">
                    <p>Email ID: ${randomId} | Meal Voting System</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Reset password email sent successfully to:', email, `| Email ID: ${randomId}`);
    } catch (error) {
        console.error('Error sending email:', error);
        if (error.code === 'EAUTH') {
            throw new Error('Email authentication failed. Please check your email credentials.');
        }
        throw new Error('Failed to send reset password email');
    }
};