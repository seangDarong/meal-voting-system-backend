import express from 'express';
import {submitVoteOptions , finalizeVotePoll, getTodayVotePoll, editVotePoll, getAllActiveVotePolls , deleteVotePoll, getPendingVotePoll } from '@/controllers/votePoll';
import { authenticateToken } from '@/middlewares/auth';
import { authorizeRole } from '@/middlewares/authorizeRole';

import { SubmitVoteOptionsRequest, FinalizeVotePollRequest, GetTodayVotePollRequest, EditVotePollRequest ,GetActiveVotePollRequest , DeleteVotePollRequest, GetPendingVotePollRequest}  from '@/types/requests';

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
 *         description: Vote poll created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Vote poll created successfully"
 *                 pollId:
 *                   type: integer
 *                   example: 10
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
 *     responses:
 *       200:
 *         description: Poll finalized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Poll finalized successfully."
 *                 pollId:
 *                   type: integer
 *                   example: 7
 *                 finalizedDishes:
 *                   type: array
 *                   items:
 *                     type: integer
 *       400:
 *         description: Invalid request (poll not closed, invalid dishes)
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
 *     summary: Get today's vote poll and its results (Staff only)
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
 *                 mealDate:
 *                   type: string
 *                   format: date
 *                 voteDate:
 *                   type: string
 *                   format: date-time
 *                 status:
 *                   type: string
 *                   enum: [pending, open, close, finalized]
 *                 dishes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       dishId:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       name_kh:
 *                         type: string
 *                       description:
 *                         type: string
 *                       description_kh:
 *                         type: string
 *                       imageURL:
 *                         type: string
 *                       categoryId:
 *                         type: integer
 *                       voteCount:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff role required
 *       404:
 *         description: No poll for today
 *       500:
 *         description: Internal server error
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
 *     responses:
 *       200:
 *         description: Vote poll updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff role required
 *       404:
 *         description: Poll not found
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
 *     summary: Get all active vote polls (pending, open, close)
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
 *                   mealDate:
 *                     type: string
 *                     format: date
 *                   voteDate:
 *                     type: string
 *                     format: date-time
 *                   status:
 *                     type: string
 *                     enum: [pending, open, close]
 *                   dishes:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         dishId:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         name_kh:
 *                           type: string
 *                         description:
 *                           type: string
 *                         description_kh:
 *                           type: string
 *                         imageURL:
 *                           type: string
 *                         categoryId:
 *                           type: integer
 *                         voteCount:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: No active polls found
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
 *     responses:
 *       200:
 *         description: Vote poll deleted successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff role required
 *       404:
 *         description: Poll not found
 *       500:
 *         description: Internal server error
 */
votePollRouter.delete('/:id',authenticateToken,authorizeRole('staff'),(req,res,next) => {
    deleteVotePoll(req as DeleteVotePollRequest, res).catch(next);
});

/**
 * @swagger
 * /api/polls/pending:
 *   get:
 *     summary: Get a pending vote poll by date (defaults to today)
 *     description: Fetch the pending vote poll for the given date. If no date is provided, today's date is used.
 *     tags: [VotePoll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *           example: 2025-09-10
 *         required: false
 *         description: The date of the poll (YYYY-MM-DD). Defaults to today if not provided.
 *     responses:
 *       200:
 *         description: Pending vote poll retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 votePollId:
 *                   type: integer
 *                   example: 15
 *                 mealDate:
 *                   type: string
 *                   format: date
 *                   example: 2025-09-11
 *                 voteDate:
 *                   type: string
 *                   format: date
 *                   example: 2025-09-10
 *                 status:
 *                   type: string
 *                   example: pending
 *                 dishes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       dishId:
 *                         type: integer
 *                         example: 7
 *                       name:
 *                         type: string
 *                         example: "Khor Trey Sambak"
 *                       name_kh:
 *                         type: string
 *                         example: "ខត្រីសំបាក់"
 *                       description:
 *                         type: string
 *                         example: "Traditional Cambodian fish curry with coconut milk."
 *                       description_kh:
 *                         type: string
 *                         example: "ម្ហូបប្រពៃណីខ្មែរ"
 *                       imageURL:
 *                         type: string
 *                         example: "https://example.com/image.jpg"
 *                       categoryId:
 *                         type: integer
 *                         example: 3
 *                       voteCount:
 *                         type: integer
 *                         example: 42
 *       400:
 *         description: Invalid date format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff role required
 *       404:
 *         description: No pending poll found for the given date
 *       500:
 *         description: Internal server error
 */

votePollRouter.get('/pending',authenticateToken,authorizeRole('staff'),(req,res,next) => {
    getPendingVotePoll(req as GetPendingVotePollRequest, res).catch(next);
});



export default votePollRouter;
