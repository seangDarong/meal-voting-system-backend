import express from 'express';
import { 
    setupGraduationDate,
    staffLogin
} from '@/controllers/user';
import { authenticateToken } from '@/middlewares/auth';

import { SetupGraduationDateRequest } from '@/types/requests';

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
 * /api/auth/staff-login:
 *   post:
 *     summary: Staff/Admin login
 *     description: Authenticate a staff or admin user using email and password. Returns a JWT token on successful login.
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
 *                 example: staff@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: mySecret123
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
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: staff@example.com
 *                     role:
 *                       type: string
 *                       enum: [staff, admin]
 *                       example: staff
 *                     displayName:
 *                       type: string
 *                       example: John Doe
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Invalid credentials or not a staff/admin account
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Invalid credentials
 *       403:
 *         description: Account is deactivated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Account is deactivated. Please contact an administrator.
 *       500:
 *         description: Server error during login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Error logging in
 */

router.post('/staff-login', staffLogin);

// ===== MICROSOFT AUTHENTICATION ROUTES =====

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
router.post('/setup-graduation', authenticateToken, (req, res, next) => {
    setupGraduationDate(req as SetupGraduationDateRequest, res).catch(next);
});

export default router;