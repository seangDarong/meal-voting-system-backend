import express from 'express';
import passport from 'passport';
import { handleMicrosoftCallback } from '../controllers/user.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Microsoft Authentication
 *   description: Microsoft OAuth authentication routes
 */

/**
 * @swagger
 * /auth/microsoft:
 *   get:
 *     summary: Initiate Microsoft OAuth authentication
 *     tags: [Microsoft Authentication]
 *     description: Redirects user to Microsoft login page for OAuth authentication
 *     responses:
 *       302:
 *         description: Redirect to Microsoft OAuth login page
 *       500:
 *         description: Authentication service error
 */
router.get('/', passport.authenticate('microsoft'));

/**
 * @swagger
 * /auth/microsoft/callback:
 *   get:
 *     summary: Microsoft OAuth callback handler
 *     tags: [Microsoft Authentication]
 *     description: Handles the callback from Microsoft OAuth service and processes user authentication
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code from Microsoft
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State parameter for security
 *     responses:
 *       302:
 *         description: Redirect to frontend with authentication result
 *         headers:
 *           Location:
 *             description: Redirect URL with token or error
 *             schema:
 *               type: string
 *               examples:
 *                 success_setup_needed:
 *                   value: "http://localhost:5173/setup-account?token=jwt_token&needs_password=true"
 *                 success_complete:
 *                   value: "http://localhost:5173/auth/callback?token=jwt_token&provider=microsoft"
 *                 error:
 *                   value: "http://localhost:5173/login?error=microsoft_auth_failed"
 */
router.get('/callback',
    passport.authenticate('microsoft', { 
        failureRedirect: `${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/login?error=microsoft_auth_failed` 
    }),
    handleMicrosoftCallback
);

export default router;