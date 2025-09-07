import express from 'express';
import {submitVoteOptions , finalizeVotePoll, getTodayVotePoll } from '@/controllers/votePoll';
import { authenticateToken } from '@/middlewares/auth';
import { authorizeRole } from '@/middlewares/authorizeRole';

import { SubmitVoteOptionsRequest, GetActiveVotePollRequest , FinalizeVotePollRequest, GetTodayVotePoll } from '@/types/requests';

const votePollRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: VotePoll
 *   description: Canteen voting operations
 */

/**
 * @swagger
 * /api/polls:
 *   post:
 *     summary: Submit vote options for a poll (Staff only)
 *     tags: [VotePoll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mealDate
 *               - dishIds
 *             properties:
 *               mealDate:
 *                 type: string
 *                 format: date
 *                 description: Date for the meal
 *               dishIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of dish IDs to include in the vote
 *     responses:
 *       201:
 *         description: Vote options submitted successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff role required
 *       409:
 *         description: Poll already exists for this mealDate
 */
votePollRouter.post('/',authenticateToken,authorizeRole('staff'),(req, res, next) => {
    submitVoteOptions(req as SubmitVoteOptionsRequest, res).catch(next);
});

/**
 * @swagger
 * /api/polls/{id}/finalize:
 *   post:
 *     summary: Finalize a vote poll with selected dishes (Staff only)
 *     tags: [VotePoll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the poll to finalize
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - selectedDishIds
 *             properties:
 *               selectedDishIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Dish IDs that were finalized
 *     responses:
 *       200:
 *         description: Poll finalized successfully
 *       400:
 *         description: Invalid request (e.g., poll not closed, invalid dishes)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff role required
 *       404:
 *         description: Poll not found
 */

votePollRouter.post('/:id/finalize',authenticateToken,authorizeRole('staff'),(req,res,next) => {
    finalizeVotePoll(req as FinalizeVotePollRequest, res).catch(next);
});


/**
 * @swagger
 * /api/polls/today:
 *   get:
 *     summary: Get today's vote poll and its results (staff only)
 *     tags: [VotePoll]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's vote poll with candidate dishes and their vote counts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 votePollId:
 *                   type: integer
 *                   example: 12
 *                 mealDate:
 *                   type: string
 *                   format: date
 *                   example: "2025-09-07"
 *                 voteDate:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-09-07T00:00:00.000Z"
 *                 status:
 *                   type: string
 *                   enum: [pending, open, close, finalize]
 *                   example: "open"
 *                 dishes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       candidateDishId:
 *                         type: integer
 *                         example: 34
 *                       dishId:
 *                         type: integer
 *                         example: 5
 *                       dish:
 *                         type: string
 *                         example: "Samlor Machu Kroeung"
 *                       voteCount:
 *                         type: integer
 *                         example: 18
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff role required
 *       404:
 *         description: No poll for today
 *       500:
 *         description: Internal server error cannot get vote result
 */


votePollRouter.get('/today',authenticateToken,authorizeRole('staff'),(req,res,next) => {
    getTodayVotePoll(req as GetTodayVotePoll, res).catch(next);
});




export default votePollRouter;
