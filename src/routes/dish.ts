import express from 'express';
import {addDish, updateDish, getAllDishes, deleteDish, getAllDishesByCategory, getDishById, getMostFavoritedDishes, getMostRatedDishes} from '@/controllers/dish';
import { authenticateToken } from '@/middlewares/auth';
import {upload} from '@/middlewares/upload';
import { authorizeRole } from '@/middlewares/authorizeRole';

import { AddDishRequest, UpdateDishRequest, DeleteDishRequest } from '@/types/requests';

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
 *     summary: Add a new dish (staff only)
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
 *                   example: Dish created successfully
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
 *
 *   get:
 *     summary: Get all dishes with pagination
 *     tags: [Dishes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: Number of dishes to return (max 50)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of items to skip
 *     responses:
 *       200:
 *         description: List of dishes with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Dishes fetched successfully
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Dish'
 *                 total:
 *                   type: integer
 *                   description: Total number of dishes
 *                   example: 120
 *                 nextOffset:
 *                   type: integer
 *                   nullable: true
 *                   description: Offset for the next page, or null if no more data
 *                   example: 10
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
 *       500:
 *         description: Internal server error while fetching dishes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
dishRouter.post('/', authenticateToken,authorizeRole('staff'),upload.single('imageFile'),(req, res, next) => {
    addDish(req as AddDishRequest, res).catch(next);
});
dishRouter.get('/', getAllDishes);

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
dishRouter.put('/:id',authenticateToken,authorizeRole('staff'),upload.single('imageFile'),(req, res, next) => {
    updateDish(req as UpdateDishRequest, res).catch(next);
});
dishRouter.delete('/:id',authenticateToken,authorizeRole('staff'),(req, res, next) => {
    deleteDish(req as DeleteDishRequest, res).catch(next);
});

/**
 * @swagger
 * /api/dishes/category/{categoryId}:
 *   get:
 *     summary: Get all dishes by category with pagination
 *     tags: [Dishes]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: Number of dishes to return (max 50)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of items to skip
 *     responses:
 *       200:
 *         description: List of dishes in the specified category with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Dishes fetched successfully for category 2
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Dish'
 *                 total:
 *                   type: integer
 *                   description: Total number of dishes in this category
 *                   example: 42
 *                 nextOffset:
 *                   type: integer
 *                   nullable: true
 *                   description: Offset for the next page, or null if no more data
 *                   example: 10
 *       400:
 *         description: Invalid category ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: No dishes found for this category
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error while fetching dishes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

dishRouter.get('/category/:categoryId',getAllDishesByCategory);

/**
 * @swagger
 * /api/dishes/most-rated:
 *   get:
 *     summary: Get dishes sorted by most ratings
 *     tags: [Dishes]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: Number of dishes to return (max 50)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of items to skip
 *     responses:
 *       200:
 *         description: List of most rated dishes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Dish'
 *                 total:
 *                   type: integer
 *                 nextOffset:
 *                   type: integer
 *                   nullable: true
 *       500:
 *         description: Internal server error while fetching most rated dishes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

dishRouter.get('/most-rated', getMostRatedDishes);

/**
 * @swagger
 * /api/dishes/most-favorited:
 *   get:
 *     summary: Get dishes sorted by most favorites
 *     tags: [Dishes]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: Number of dishes to return (max 50)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of items to skip
 *     responses:
 *       200:
 *         description: List of most favorited dishes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Dish'
 *                 total:
 *                   type: integer
 *                 nextOffset:
 *                   type: integer
 *                   nullable: true
 *       500:
 *         description: Internal server error while fetching most favorited dishes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

dishRouter.get('/most-favorited', getMostFavoritedDishes);

/**
 * @swagger
 * /api/dishes/{id}:
 *   get:
 *     summary: Get a dish by ID
 *     tags: [Dishes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric ID of the dish to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved the dish
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dish:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     name_kh:
 *                       type: string
 *                     imageURL:
 *                       type: string
 *                     ingredient:
 *                       type: string
 *                     ingredient_kh:
 *                       type: string
 *                     description:
 *                       type: string
 *                     description_kh:
 *                       type: string
 *                     categoryId:
 *                       type: integer
 *       400:
 *         description: Invalid dish ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid dish ID
 *       404:
 *         description: Dish not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Dish not found
 *       500:
 *         description: Internal server error while fetching dish
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error while fetching dish
 */
dishRouter.get('/:id',(req, res, next) => {
    getDishById(req, res).catch(next);
});

export default dishRouter;
