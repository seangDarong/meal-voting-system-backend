import express from 'express';
import passport from 'passport';
import { handleMicrosoftCallback } from '@/controllers/user';

const router = express.Router();

router.get('/', passport.authenticate('microsoft'));

router.get('/callback',
    passport.authenticate('microsoft', {
        failureRedirect: `${process.env.FRONTEND_URL}/login?error=microsoft_auth_failed`
    }),
    handleMicrosoftCallback
);

export default router;