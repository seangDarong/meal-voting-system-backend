import express from 'express';
import { addStaff, 
    deleteUser, 
    deactivateUser,
    reactivateUser,
    getAllUsers } from '../controllers/admin.js';
import { authenticateToken } from '../middlewares/auth.js';
import { authorizeRole } from '../middlewares/authorizeRole.js';

const router = express.Router();

router.post('/create-account', authenticateToken, authorizeRole('admin'), addStaff);
router.delete('/users/:id', authenticateToken, authorizeRole('admin'), deleteUser);
router.patch('/users/:id/deactivate', authenticateToken, authorizeRole('admin'), deactivateUser);
router.patch('/users/:id/reactivate', authenticateToken, authorizeRole('admin'), reactivateUser);
router.get('/users', authenticateToken, authorizeRole('admin'), getAllUsers);

export default router;