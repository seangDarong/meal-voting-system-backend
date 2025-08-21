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
 *     summary: Get current user's wish
 *     tags: [Wishes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user's wish retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dishId:
 *                   type: integer
 *                   example: 12
 *                 dishName:
 *                   type: string
 *                   example: "Spicy Noodles"
 *                 image:
 *                   type: string
 *                   example: "https://example.com/dishes/noodles.jpg"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-08-21T12:34:56.000Z"
 *       404:
 *         description: Wish not found
 *       401:
 *         description: Unauthorized
 */
router.get('/mine', authenticateToken, getMyWish);

/**
 * @swagger
 * /api/wishes/all:
 *   get:
 *     summary: Get all dishes with wish counts
 *     tags: [Wishes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [totalWishes, name]
 *           default: totalWishes
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: List of dishes with wish counts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dishes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DishWish'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     totalItems:
 *                       type: integer
 *                       example: 45
 *                     itemsPerPage:
 *                       type: integer
 *                       example: 10
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPrevPage:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: Unauthorized
 */
router.get('/all', authenticateToken, getAllWishes);

/**
 * @swagger
 * /api/wishes:
 *   put:
 *     summary: Update current user's wish
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
 *                 example: 7
 *     responses:
 *       200:
 *         description: Wish updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Wish updated"
 *                 dishId:
 *                   type: integer
 *                   example: 7
 *       403:
 *         description: Cooldown active
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cooldown active"
 *                 cooldownRemaining:
 *                   type: integer
 *                   example: 1200
 *       400:
 *         description: Validation error (dishId missing)
 *       401:
 *         description: Unauthorized
 *
 *   delete:
 *     summary: Remove current user's wish
 *     tags: [Wishes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wish removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Wish removed"
 *       403:
 *         description: Cooldown active
 *       404:
 *         description: Wish not found
 *       401:
 *         description: Unauthorized
 */
router.put('/', authenticateToken, updateWish);
router.delete('/', authenticateToken, removeWish);

export default router;

