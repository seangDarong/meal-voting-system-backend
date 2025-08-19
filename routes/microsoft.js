import express from 'express';
import passport from 'passport';
import { handleMicrosoftCallback } from '../controllers/user.js';

const router = express.Router();

router.get('/', passport.authenticate('microsoft'));

router.get('/callback',
    passport.authenticate('microsoft', {
        failureRedirect: `${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/login?error=microsoft_auth_failed`
    }),
    handleMicrosoftCallback
);

export default router;