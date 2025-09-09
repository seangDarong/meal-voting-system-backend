import express from 'express';
import {submitVoteOptions , finalizeVotePoll, getTodayVotePoll, editVotePoll, getAllActiveVotePolls , deleteVotePoll } from '@/controllers/votePoll';
import { authenticateToken } from '@/middlewares/auth';
import { authorizeRole } from '@/middlewares/authorizeRole';

import { SubmitVoteOptionsRequest, FinalizeVotePollRequest, GetTodayVotePollRequest, EditVotePollRequest ,GetActiveVotePollRequest , DeleteVotePollRequest}  from '@/types/requests';

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
    getTodayVotePoll(req as GetTodayVotePollRequest, res).catch(next);
});

/**
 * @swagger
 * /api/polls/{id}:
 *   patch:
 *     summary: Edit a vote poll by adding/removing candidate dishes (Staff only)
 *     tags: [VotePoll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the poll to edit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dishIds
 *             properties:
 *               dishIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of dish IDs for the updated poll. Dishes not in the list will be removed, new ones added.
 *     responses:
 *       200:
 *         description: Vote poll updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Vote poll updated successfully."
 *                 pollId:
 *                   type: integer
 *                   example: 42
 *                 addedDishes:
 *                   type: array
 *                   items:
 *                     type: integer
 *                   example: [5]
 *                 removedDishes:
 *                   type: array
 *                   items:
 *                     type: integer
 *                   example: [2]
 *       400:
 *         description: Validation error (e.g., dishIds empty or invalid)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff role required
 *       404:
 *         description: Vote poll not found
 *       500:
 *         description: Internal server error
 */
votePollRouter.patch('/:id',authenticateToken,authorizeRole('staff'),(req,res,next) => {
    editVotePoll(req as EditVotePollRequest, res).catch(next);
});
/**
 * @swagger
 * /api/polls/active:
 *   get:
 *     summary: Get all active vote polls (pending, open, close) sorted by mealDate descending
 *     tags: [VotePoll]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active vote polls
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   votePollId:
 *                     type: integer
 *                     example: 12
 *                   mealDate:
 *                     type: string
 *                     format: date
 *                     example: "2025-09-10"
 *                   voteDate:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-09T00:00:00.000Z"
 *                   status:
 *                     type: string
 *                     enum: [pending, open, close]
 *                     example: "open"
 *                   dishes:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         candidateDishId:
 *                           type: integer
 *                           example: 34
 *                         dishId:
 *                           type: integer
 *                           example: 5
 *                         dish:
 *                           type: string
 *                           example: "Samlor Machu Kroeung"
 *                         voteCount:
 *                           type: integer
 *                           example: 18
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff role required
 *       404:
 *         description: No active vote polls found
 *       500:
 *         description: Internal server error
 */
votePollRouter.get('/active',authenticateToken,authorizeRole('staff'),(req,res,next) => {
    getAllActiveVotePolls(req as GetActiveVotePollRequest, res).catch(next);
});

/**
 * @swagger
 * /api/polls/{id}:
 *   delete:
 *     summary: Delete a pending vote poll (Staff only)
 *     tags: [VotePoll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the vote poll to delete
 *     responses:
 *       200:
 *         description: Vote poll deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Vote poll deleted successfully"
 *                 pollId:
 *                   type: integer
 *                   example: 12
 *       400:
 *         description: Invalid poll ID or cannot delete non-pending poll
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Only pending polls can be deleted"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff role required
 *       404:
 *         description: Vote poll not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Vote poll not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
votePollRouter.delete('/:id',authenticateToken,authorizeRole('staff'),(req,res,next) => {
    deleteVotePoll(req as DeleteVotePollRequest, res).catch(next);
});






export default votePollRouter;
