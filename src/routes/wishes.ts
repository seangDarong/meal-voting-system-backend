import express from 'express';
import { getMyWish,
        updateWish,
        removeWish,
        getAllWishes
 } from '@/controllers/wishList';
import { authenticateToken } from '@/middlewares/auth';

import { GetMyWishRequest, GetAllWishesRequest, UpdateWishRequest, RemoveWishRequest } from '@/types/requests';

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
 *                 dishNameKh:
 *                   type: string
 *                   example: "មីហាល"
 *                 image:
 *                   type: string
 *                   example: "https://example.com/dishes/noodles.jpg"
 *                 description:
 *                   type: string
 *                   example: "Delicious spicy noodles with vegetables"
 *                 descriptionKh:
 *                   type: string
 *                   example: "មីហាលឆ្ងាញ់មានបន្លែ"
 *                 categoryId:
 *                   type: integer
 *                   example: 3
 *                 categoryName:
 *                   type: string
 *                   example: "Noodles"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-08-21T12:34:56.000Z"
 *       404:
 *         description: Wish not found
 *       401:
 *         description: Unauthorized
 */
router.get('/mine', authenticateToken, (req, res, next) => {
  getMyWish(req as GetMyWishRequest, res).catch(next);
});



/**
 * @swagger
 * /api/wishes/all:
 *   get:
 *     summary: View collective wish list status
 *     tags: [Wishes]
 *     description: >
 *           Returns a paginated list of dishes with their total number of wishes.
 *           Includes dishes with 0 wishes (due to LEFT JOIN).
 *           Supports optional sorting by popularity (`totalWishes`) or by `name`.
 *     parameters:
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination.
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: Number of items per page (max 50).
 *       - name: sortBy
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [totalWishes, name]
 *           default: totalWishes
 *         description: Field to sort by (popularity or name).
 *       - name: sortOrder
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort direction.
 *     responses:
 *       '200':
 *         description: Successful response with dishes and pagination metadata.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dishes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       dishId:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: Fried Rice
 *                       imageUrl:
 *                         type: string
 *                         example: https://example.com/fried_rice.jpg
 *                       categoryId:
 *                         type: integer
 *                         example: 2
 *                       categoryName:
 *                         type: string
 *                         example: Asian
 *                       totalWishes:
 *                         type: integer
 *                         example: 15
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
 *                       example: 50
 *                     itemsPerPage:
 *                       type: integer
 *                       example: 10
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPrevPage:
 *                       type: boolean
 *                       example: false
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 *                 error:
 *                   type: string
 *                   example: "Error details here"
 */
router.get('/all', (req, res, next) => {
    getAllWishes(req as GetAllWishesRequest, res).catch(next);
});


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
router.put('/', authenticateToken,(req, res, next) => {
    updateWish(req as UpdateWishRequest, res).catch(next);
});

router.delete('/', authenticateToken,(req, res, next) => {
    removeWish(req as RemoveWishRequest, res).catch(next);
});


export default router;

