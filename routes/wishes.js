import express from 'express';
import { getMyWish,
        updateWish,
        removeWish
 } from '../controllers/wishList.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/mine', authenticateToken, getMyWish);
router.put('/', authenticateToken, updateWish);
router.delete('/', authenticateToken, removeWish);

export default router;

