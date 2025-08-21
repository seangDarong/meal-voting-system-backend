import express from 'express';
import { votePollFeedback } from '../controllers/feedback.js';

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
router.post('/', votePollFeedback);

export default router;