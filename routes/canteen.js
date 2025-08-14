import express from 'express';
import {submitVoteOptions , getActiveVotePoll} from '../controllers/canteen.js';
import { authenticateToken } from '../middlewares/auth.js';
import { authorizeRole } from '../middlewares/authorizeRole.js';

const canteenRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Canteen
 *   description: Canteen voting operations
 */

/**
 * @swagger
 * /api/vote-option:
 *   post:
 *     summary: Submit vote options for a poll (Staff only)
 *     tags: [Canteen]
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
 *               - voteDate
 *               - dishIds
 *             properties:
 *               mealDate:
 *                 type: string
 *                 format: date
 *                 description: Date for the meal
 *               voteDate:
 *                 type: string
 *                 format: date
 *                 description: Date when voting takes place
 *               dishIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of dish IDs to include in the vote
 *     responses:
 *       201:
 *         description: Vote options submitted successfully
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
 *                   type: object
 *                   properties:
 *                     votePoll:
 *                       $ref: '#/components/schemas/VotePoll'
 *                     candidateDishes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CandidateDish'
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
 */
canteenRouter.post('/',authenticateToken,authorizeRole('staff'),submitVoteOptions);
canteenRouter.get('/active',getActiveVotePoll);

export default canteenRouter;
