import express from 'express';
import {getAllCategory} from '@/controllers/category';
import { authenticateToken } from '@/middlewares/auth';
import { authorizeRole } from '@/middlewares/authorizeRole';

const categoryRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management operations
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories (Staff only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all categories
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
 *                     $ref: '#/components/schemas/Category'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Staff role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
categoryRouter.get('/',getAllCategory);

export default categoryRouter;