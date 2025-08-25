import express from 'express';
import { createFeedback, getFeedback, createFeedbackForDish, getDishFeedback } from '../controllers/feedback.js';

const router = express.Router();

// Anonymous feedback endpoint

/**
 * @swagger
 * /api/feedback:
 *  post:
 *      summary: Submit anonymous feedback
 *      tags: [Feedback]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          canteen:
 *                             type: integer
 *                             description: Canteen rating
 *                             example: 5
 *                          system:
 *                              type: integer
 *                              description: System rating
 *                              example: 4
 *                          content:
 *                              type: string
 *                              description: Feedback content
 *                              example: "This is my feedback"
 *      responses:
 *          201:
 *              description: Feedback submitted successfully
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              success:
 *                                  type: boolean
 *                                  example: true
 *                              message:
 *                                  type: string
 *                                  example: "Feedback submitted anonymously."
 *          500:
 *              description: Internal server error
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              success:
 *                                  type: boolean
 *                                  example: false
 *                              error:
 *                                  type: string
 *                                  example: "Feedback error: Error submitting feedback."
 */
router.post('/', createFeedback);

/**
 * @swagger
 * /api/feedback:
 *   get:
 *     summary: List anonymous feedback (paginated)
 *     tags: [Feedback]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of feedback entries to return (max 50).
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of items to skip before starting to collect results.
 *     responses:
 *       200:
 *         description: Successfully retrieved paginated feedback
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FeedbackPublic'
 *                 total:
 *                   type: integer
 *                   example: 25
 *                 nextOffset:
 *                   type: integer
 *                   nullable: true
 *                   example: 15
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Feedback error: Error fetching feedback."
 */
router.get('/', getFeedback);
/**
 * @swagger
 * /api/feedback/dish/{dishId}:
 *   post:
 *     summary: Submit feedback for a dish
 *     tags: [Feedback]
 *     parameters:
 *       - name: dishId
 *         in: path
 *         required: true
 *         description: The ID of the dish to rate.
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - food
 *             properties:
 *               food:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *     responses:
 *       '201':
 *         description: Successfully submitted feedback
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
 *                   example: Food rating submitted for dish.
 *       '400':
 *         description: Invalid dishId or food rating
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Valid dishId is required.
 *       '500':
 *         description: Server error while submitting feedback
 */
router.post('/dish/:dishId', createFeedbackForDish);


/**
 * @swagger
 * /api/feedback/dish/{dishId}:
 *   get:
 *     summary: Get feedback summary for a dish
 *     description: Retrieve average food rating and total ratings for a specific dish.
 *     tags: [Feedback]
 *     parameters:
 *       - name: dishId
 *         in: path
 *         required: true
 *         description: The ID of the dish to fetch feedback for.
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Successfully fetched feedback summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 dishId:
 *                   type: integer
 *                   example: 12
 *                 averageFoodRating:
 *                   type: string
 *                   nullable: true
 *                   example: "4.25"
 *                 totalRatings:
 *                   type: integer
 *                   example: 15
 *       '400':
 *         description: Invalid dishId provided
 *       '500':
 *         description: Server error while fetching feedback
 */

router.get('/dish/:dishId', getDishFeedback);

export default router;