import express from 'express';
import {castVote, getUserVoteHistory, updateVote } from '@/controllers/vote';
import { authenticateToken } from '@/middlewares/auth';
import { authorizeRole } from '@/middlewares/authorizeRole';

import { CastVoteRequest , UpdateVoteRequest , GetUserVoteHistoryRequest} from '@/types/requests';

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

voteRouter.get('/history',authenticateToken,authorizeRole('voter'),(req,res,next) => {
    getUserVoteHistory(req as GetUserVoteHistoryRequest, res).catch(next);
})



export default voteRouter;