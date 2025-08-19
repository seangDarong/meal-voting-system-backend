import express from 'express';
import passport from 'passport';
import { handleGoogleCallback } from '../controllers/user.js';

const router = express.Router();

router.get('/', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/callback',
    passport.authenticate('google', {
        failureRedirect: `${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/login?error=google_auth_failed`
    }),
    handleGoogleCallback
);

export default router;