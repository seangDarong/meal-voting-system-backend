import express from 'express';
import { 
    register, 
    login, 
    verifyEmail, 
    resendVerification, 
    requestPasswordReset, 
    resetPasswordWithToken,
    changePassword,
    signOut,
    setupGraduationDate,
    checkSetupNeeds,
    setupPasswordForMicrosoft,
    deactivateOwnAccount,
    getOwnProfile
} from '../controllers/user.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and account management
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// ===== BASIC AUTHENTICATION ROUTES =====

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - generation
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: School email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *               generation:
 *                 type: integer
 *                 minimum: 8
 *                 description: Student generation number
 *                 example: 10
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     generation:
 *                       type: integer
 *                     expectedGraduationDate:
 *                       type: object
 *                       properties:
 *                         month:
 *                           type: integer
 *                         year:
 *                           type: integer
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     isVerified:
 *                       type: boolean
 *                     isActive:
 *                       type: boolean
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account not verified or deactivated
 */
router.post('/login', login);


// ===== EMAIL VERIFICATION ROUTES =====

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: Verify user email
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.get('/verify-email', verifyEmail);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent
 *       404:
 *         description: User not found
 */
router.post('/resend-verification', resendVerification);

// ===== PASSWORD MANAGEMENT ROUTES =====

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: User not found
 */
router.post('/forgot-password', requestPasswordReset);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 *       403:
 *         description: Invalid or expired token
 */
router.post('/reset-password', resetPasswordWithToken);


// ===== MICROSOFT AUTHENTICATION ROUTES =====

/**
 * @swagger
 * /api/auth/setup-needs:
 *   get:
 *     summary: Check what setup is needed for Microsoft users
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Setup requirements retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 needsPassword:
 *                   type: boolean
 *                   description: Whether the user needs to set up a password
 *                 needsGraduationDate:
 *                   type: boolean
 *                   description: Whether the user needs to set up graduation date
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                     isMicrosoftUser:
 *                       type: boolean
 *                     hasPassword:
 *                       type: boolean
 *                     expectedGraduationDate:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         month:
 *                           type: integer
 *                         year:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/setup-needs', authenticateToken, checkSetupNeeds);

/**
 * @swagger
 * /api/auth/setup-password:
 *   post:
 *     summary: Setup password for Microsoft authenticated users
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: The password to set for the Microsoft user account
 *     responses:
 *       200:
 *         description: Password set successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password set successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                     hasPassword:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Bad request - validation error or password already set
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post('/setup-password', authenticateToken, setupPasswordForMicrosoft);

/**
 * @swagger
 * /api/auth/setup-graduation:
 *   post:
 *     summary: Setup graduation date for user (fallback for Microsoft users)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - generation
 *             properties:
 *               generation:
 *                 type: integer
 *                 minimum: 8
 *                 description: Generation number (used to calculate graduation date)
 *                 example: 10
 *     responses:
 *       200:
 *         description: Graduation date set successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Graduation date set successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     expectedGraduationDate:
 *                       type: object
 *                       properties:
 *                         month:
 *                           type: integer
 *                           example: 12
 *                         year:
 *                           type: integer
 *                           example: 2027
 *       400:
 *         description: Bad request - validation error or graduation date already set
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post('/setup-graduation', authenticateToken, setupGraduationDate);

export default router;