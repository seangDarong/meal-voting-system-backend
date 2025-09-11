import express from 'express';
import {castVote, getUserVoteHistory, updateVote ,getUserTodayVote} from '@/controllers/vote';
import { authenticateToken } from '@/middlewares/auth';
import { authorizeRole } from '@/middlewares/authorizeRole';

import { CastVoteRequest , UpdateVoteRequest , GetUserVoteHistoryRequest, GetUserVoteTodayRequest} from '@/types/requests';

const voteRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Vote
 *   description: Endpoints for casting and updating votes
 */

/**
 * @swagger
 * /api/votes:
 *   post:
 *     summary: Cast a vote for today's poll
 *     tags: [Vote]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dishId
 *             properties:
 *               dishId:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       200:
 *         description: Vote cast successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Vote cast successfully"
 *                 vote:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 12
 *                     votePollId:
 *                       type: integer
 *                       example: 5
 *                     dishId:
 *                       type: integer
 *                       example: 3
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                       example: "9f0b2a76-7d67-4c63-89a4-8d5d98f4c27e"
 *       400:
 *         description: Invalid dish for today
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
 *         description: Already voted or no poll open today
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */


voteRouter.post('/',authenticateToken,authorizeRole('voter'),(req,res,next) => {
    castVote(req as CastVoteRequest, res).catch(next);
});

/**
 * @swagger
 * /api/votes:
 *   put:
 *     summary: Update an existing vote for today's poll
 *     tags: [Vote]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dishId
 *             properties:
 *               dishId:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       200:
 *         description: Vote updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Vote updated successfully."
 *                 vote:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 12
 *                     votePollId:
 *                       type: integer
 *                       example: 5
 *                     dishId:
 *                       type: integer
 *                       example: 5
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                       example: "9f0b2a76-7d67-4c63-89a4-8d5d98f4c27e"
 *       400:
 *         description: Invalid dish for today
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
 *         description: No poll open today
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: No existing vote found to update
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
voteRouter.put('/',authenticateToken,authorizeRole('voter'),(req,res,next) => {
    updateVote(req as UpdateVoteRequest, res).catch(next);
});

/**
 * @swagger
 * /api/votes/history:
 *   get:
 *     summary: Get the user's vote history for a specific date
 *     description: |
 *       Fetches the user's voting history for a given date.  
 *       If no date is provided, today's date is used.
 *     tags:
 *       - Vote
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-09-12"
 *         required: false
 *         description: Date for which to fetch vote history (YYYY-MM-DD).
 *     responses:
 *       200:
 *         description: Successfully retrieved user's vote history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 votePollId:
 *                   type: integer
 *                   example: 42
 *                 mealDate:
 *                   type: string
 *                   format: date
 *                   example: "2025-09-13"
 *                 voteDate:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-09-12T00:00:00.000Z"
 *                 userVote:
 *                   type: object
 *                   nullable: true
 *                   description: User's vote record if available
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 15
 *                     dishId:
 *                       type: integer
 *                       example: 101
 *                     Dish:
 *                       type: object
 *                       description: Dish details
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 101
 *                         name:
 *                           type: string
 *                           example: "Beef Lok Lak"
 *                 dishes:
 *                   type: array
 *                   description: Returned only if poll is open or closed (not finalized)
 *                   items:
 *                     type: object
 *                     properties:
 *                       candidateDishId:
 *                         type: integer
 *                         example: 5
 *                       dishId:
 *                         type: integer
 *                         example: 101
 *                       dish:
 *                         type: string
 *                         example: "Beef Lok Lak"
 *                       voteCount:
 *                         type: integer
 *                         example: 12
 *                 selectedDishes:
 *                   type: array
 *                   description: Returned only if poll is finalized
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 3
 *                       dishId:
 *                         type: integer
 *                         example: 101
 *                       isSelected:
 *                         type: boolean
 *                         example: true
 *       400:
 *         description: Invalid date format
 *       401:
 *         description: Unauthorized (no token or invalid token)
 *       404:
 *         description: No poll found for the given date
 *       500:
 *         description: Internal server error
 */

voteRouter.get('/history',authenticateToken,authorizeRole('voter'),(req,res,next) => {
    getUserVoteHistory(req as GetUserVoteHistoryRequest, res).catch(next);
})

/**
 * @swagger
 * /api/votes/today:
 *   get:
 *     summary: Get the current user's vote for today's poll
 *     tags: [Vote]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User vote fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 votePollId:
 *                   type: integer
 *                   example: 12
 *                 voteDate:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-09-11T00:00:00.000Z"
 *                 userVote:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 34
 *                     votePollId:
 *                       type: integer
 *                       example: 12
 *                     dishId:
 *                       type: integer
 *                       example: 7
 *                     userId:
 *                       type: integer
 *                       example: 5
 *                     Dish:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 7
 *                         name:
 *                           type: string
 *                           example: "Pork Leg and Winter Melon Soup"
 *                         name_kh:
 *                           type: string
 *                           example: "ស្ងោរត្រឡាចជើងជ្រូក"
 *                 candidateDishes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 22
 *                       dishId:
 *                         type: integer
 *                         example: 7
 *                       name:
 *                         type: string
 *                         example: "Pork Leg and Winter Melon Soup"
 *                       name_kh:
 *                         type: string
 *                         example: "ស្ងោរត្រឡាចជើងជ្រូក"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No poll open today
 *       500:
 *         description: Internal server error
 */
voteRouter.get('/today',authenticateToken,authorizeRole('voter'),(req,res,next) => {
    getUserTodayVote(req as GetUserVoteTodayRequest, res).catch(next);
})



export default voteRouter;