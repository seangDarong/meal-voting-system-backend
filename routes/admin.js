import express from 'express';
import { addStaff, deleteUser, deactivateUser } from '../controllers/admin.js';
import { authenticateToken } from '../middlewares/auth.js';
import { authorizeRole } from '../middlewares/authorizeRole.js';

const router = express.Router();

router.post('/create-account', authenticateToken, authorizeRole('admin'), addStaff);
router.delete('/users/:id', authenticateToken, authorizeRole('admin'), deleteUser);
router.patch('/users/:id/deactivate', authenticateToken, authorizeRole('admin'), deactivateUser);

export default router;