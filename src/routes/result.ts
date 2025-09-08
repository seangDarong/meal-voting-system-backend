import express from 'express';
import {getTodayVoteResult,getUpCommingMeal} from '@/controllers/votePoll';

import { GetTodayVoteResultRequest, GetUpComingMealRequest } from '@/types/requests';

const resultRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Result
 *   description: Endpoints to fetch voting results and upcoming meals
 */

/**
 * @swagger
 * /api/results/today:
 *   get:
 *     summary: Get today's vote poll result
 *     tags: [Result]
 *     responses:
 *       200:
 *         description: Successfully retrieved today's vote results
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
 *                   example: "2025-09-03"
 *                 voteDate:
 *                   type: string
 *                   format: date
 *                   example: "2025-09-02"
 *                 status:
 *                   type: string
 *                   example: "open"
 *                 dishes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       candidateDishId:
 *                         type: integer
 *                         example: 45
 *                       dishId:
 *                         type: integer
 *                         example: 7
 *                       dish:
 *                         type: string
 *                         example: "Spaghetti Bolognese"
 *                       voteCount:
 *                         type: integer
 *                         example: 23
 *       404:
 *         description: No poll found for today
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


resultRouter.get('/today',(req, res, next) => {
    getTodayVoteResult(req as GetTodayVoteResultRequest, res).catch(next);
});

/**
 * @swagger
 * /api/results/upcoming:
 *   get:
 *     summary: Get upcoming finalized meal (selected dishes)
 *     tags: [Result]
 *     responses:
 *       200:
 *         description: Successfully retrieved upcoming finalized meal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 votePollId:
 *                   type: integer
 *                   example: 14
 *                 mealDate:
 *                   type: string
 *                   format: date
 *                   example: "2025-09-04"
 *                 voteDate:
 *                   type: string
 *                   format: date
 *                   example: "2025-09-03"
 *                 status:
 *                   type: string
 *                   example: "finalize"
 *                 dish:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 9
 *                       votePollId:
 *                         type: integer
 *                         example: 14
 *                       dishId:
 *                         type: integer
 *                         example: 3
 *                       isSelected:
 *                         type: boolean
 *                         example: true
 *                       Dish:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 3
 *                           name:
 *                             type: string
 *                             example: "Chicken Curry"
 *       404:
 *         description: No finalized poll found for today
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
resultRouter.get('/upcoming',(req, res, next) => {
    getUpCommingMeal(req as GetUpComingMealRequest, res).catch(next);
})

export default resultRouter;