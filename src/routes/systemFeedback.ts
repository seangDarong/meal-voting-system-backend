import express, { Request, Response } from 'express';
import { createFeedback, getFeedback } from "@/controllers/systemFeedback";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: System Feedback
 *   description: System Feedback management
 */

/**
 * @swagger
 * /api/system-feedback:
 *   post:
 *     summary: Submit anonymous feedback
 *     tags: [System Feedback]
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
 * /api/system-feedback:
 *   get:
 *     summary: List anonymous feedback (paginated)
 *     tags: [System Feedback]
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

export default router;