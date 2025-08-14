import express from 'express';
import {addDish, updateDish, getAllDishes, deleteDish, getAllDishesByCategory} from '../controllers/dish.js';
import { authenticateToken } from '../middlewares/auth.js';
import {upload} from '../middlewares/upload.js';
import { authorizeRole } from '../middlewares/authorizeRole.js';

const dishRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dishes
 *   description: Dish management operations
 */

/**
 * @swagger
 * /api/dishes:
 *   post:
 *     summary: Add a new dish (Staff only)
 *     tags: [Dishes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - imageFile
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Dish name in English
 *               name_kh:
 *                 type: string
 *                 description: Dish name in Khmer
 *               ingredient:
 *                 type: string
 *                 description: Dish ingredients in English
 *               ingredient_kh:
 *                 type: string
 *                 description: Dish ingredients in Khmer
 *               description:
 *                 type: string
 *                 description: Dish description in English
 *               description_kh:
 *                 type: string
 *                 description: Dish description in Khmer
 *               categoryId:
 *                 type: integer
 *                 description: Category ID
 *               imageFile:
 *                 type: string
 *                 format: binary
 *                 description: Dish image file
 *     responses:
 *       201:
 *         description: Dish created successfully
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
 *                   $ref: '#/components/schemas/Dish'
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
 *       403:
 *         description: Forbidden - Staff role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   get:
 *     summary: Get all dishes (Staff only)
 *     tags: [Dishes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all dishes
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
 *                     $ref: '#/components/schemas/Dish'
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
dishRouter.post('/', authenticateToken,authorizeRole('staff'),upload.single('imageFile'), addDish);
dishRouter.get('/',authenticateToken,authorizeRole('staff'),getAllDishes);

/**
 * @swagger
 * /api/dishes/{id}:
 *   put:
 *     summary: Update dish by ID (Staff only)
 *     tags: [Dishes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dish ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Dish name in English
 *               name_kh:
 *                 type: string
 *                 description: Dish name in Khmer
 *               ingredient:
 *                 type: string
 *                 description: Dish ingredients in English
 *               ingredient_kh:
 *                 type: string
 *                 description: Dish ingredients in Khmer
 *               description:
 *                 type: string
 *                 description: Dish description in English
 *               description_kh:
 *                 type: string
 *                 description: Dish description in Khmer
 *               categoryId:
 *                 type: integer
 *                 description: Category ID
 *               imageFile:
 *                 type: string
 *                 format: binary
 *                 description: New dish image file (optional)
 *     responses:
 *       200:
 *         description: Dish updated successfully
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
 *                   $ref: '#/components/schemas/Dish'
 *       404:
 *         description: Dish not found
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
 *       403:
 *         description: Forbidden - Staff role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete dish by ID (Staff only)
 *     tags: [Dishes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dish ID
 *     responses:
 *       200:
 *         description: Dish deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Dish not found
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
 *       403:
 *         description: Forbidden - Staff role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
dishRouter.put('/:id',authenticateToken,authorizeRole('staff'),upload.single('imageFile'),updateDish);
dishRouter.delete('/:id',authenticateToken,authorizeRole('staff'),deleteDish);

/**
 * @swagger
 * /api/dishes/category/{categoryId}:
 *   get:
 *     summary: Get all dishes by category (Staff only)
 *     tags: [Dishes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *     responses:
 *       200:
 *         description: List of dishes in the specified category
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
 *                     $ref: '#/components/schemas/Dish'
 *       404:
 *         description: Category not found
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
 *       403:
 *         description: Forbidden - Staff role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
dishRouter.get('/category/:categoryId',authenticateToken,authorizeRole('staff'),getAllDishesByCategory);

export default dishRouter;
