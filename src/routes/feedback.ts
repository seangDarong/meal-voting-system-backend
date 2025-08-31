import express, { Request, Response } from 'express';
import { createFeedback, getFeedback, createFeedbackForDish, getAllDishFeedback } from '@/controllers/feedback';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Feedback
 *   description: Feedback management
 */

/**
 * @swagger
 * /api/feedback:
 *   post:
 *     summary: Submit anonymous feedback
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               canteen:
 *                 type: integer
 *                 description: Canteen rating (1-5)
 *                 example: 5
 *               system:
 *                 type: integer
 *                 description: System rating (1-5)
 *                 example: 4
 *               content:
 *                 type: string
 *                 description: Feedback content
 *                 example: "This is my feedback"
 *     responses:
 *       '201':
 *         description: Feedback submitted successfully
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
 *                   example: "Feedback submitted anonymously."
 *       '400':
 *         description: Invalid input (no feedback fields provided)
 *       '500':
 *         description: Internal server error
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
 *       '200':
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       canteen:
 *                         type: integer
 *                         example: 4
 *                       system:
 *                         type: integer
 *                         example: 5
 *                       content:
 *                         type: string
 *                         example: "Great service!"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-08-25T12:34:56.000Z"
 *                 total:
 *                   type: integer
 *                   example: 25
 *                 nextOffset:
 *                   type: integer
 *                   nullable: true
 *                   example: 15
 *       '500':
 *         description: Internal server error
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
 *             properties:
 *               food:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               content:
 *                 type: string
 *                 description: Optional feedback text
 *                 example: "Delicious dish!"
 *     responses:
 *       '201':
 *         description: Successfully submitted dish feedback
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
 *                   example: "Feedback for dish submitted."
 *       '400':
 *         description: Invalid dishId or no feedback provided
 *       '500':
 *         description: Server error while submitting dish feedback
 */
router.post('/dish/:dishId', createFeedbackForDish);

/**
 * @swagger
 * /api/feedback/dish/{dishId}/all:
 *   get:
 *     summary: Get all feedback for a dish
 *     description: Retrieve all feedback (ratings + comments) for a specific dish with average rating.
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
 *         description: Successfully fetched all dish feedback
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
 *                 feedbacks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       food:
 *                         type: integer
 *                         example: 5
 *                       content:
 *                         type: string
 *                         example: "Very tasty!"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-08-25T12:34:56.000Z"
 *       '400':
 *         description: Invalid dishId provided
 *       '500':
 *         description: Server error while fetching dish feedback
 */
router.get('/dish/:dishId/all', getAllDishFeedback);

export default router;
