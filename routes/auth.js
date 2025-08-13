import express from 'express';
import { 
    register, 
    login, 
    verifyEmail, 
    resendVerification, 
    requestPasswordReset, 
    resetPasswordWithToken,
    handleMicrosoftCallback,
    setupGraduationDate,      // Add this import
    checkGraduationStatus     // Add this import
} from '../controllers/user.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPasswordWithToken);
router.get('/microsoft/callback', handleMicrosoftCallback);

// Add new routes for graduation setup
router.post('/setup-graduation', authenticateToken, setupGraduationDate);
router.get('/graduation-status', authenticateToken, checkGraduationStatus);

export default router;