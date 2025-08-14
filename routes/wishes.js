import express from 'express';
import { getMyWish,
        updateWish,
        removeWish,
        getAllWishes
 } from '../controllers/wishList.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Wishes
 *   description: User wishlist operations
 */

/**
 * @swagger
 * /api/wishes/mine:
 *   get:
 *     summary: Get current user's wishlist
 *     tags: [Wishes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's wishlist retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/WishList'
 *       404:
 *         description: Wishlist not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/mine', authenticateToken, getMyWish);

/**
 * @swagger
 * /api/wishes/all:
 *   get:
 *     summary: Get all wishlists
 *     tags: [Wishes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All wishlists retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WishList'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/all', authenticateToken, getAllWishes);

/**
 * @swagger
 * /wishes:
 *   put:
 *     summary: Update user's wishlist
 *     tags: [Wishes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dishId
 *             properties:
 *               dishId:
 *                 type: integer
 *                 description: ID of the dish to add to wishlist
 *     responses:
 *       200:
 *         description: Wishlist updated successfully
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
 *                 data:
 *                   $ref: '#/components/schemas/WishList'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Remove dish from user's wishlist
 *     tags: [Wishes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dish removed from wishlist successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Wishlist not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/', authenticateToken, updateWish);
router.delete('/', authenticateToken, removeWish);

export default router;

