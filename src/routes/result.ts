import express from 'express';
import {getTodayVoteResult,getUpCommingMeal} from '@/controllers/votePoll';

import { GetTodayVoteResultRequest, GetUpCommingMealRequest } from '@/types/requests';

const resultRouter = express.Router();


resultRouter.get('/today',(req, res, next) => {
    getTodayVoteResult(req as GetTodayVoteResultRequest, res).catch(next);
});

resultRouter.get('/upcomming',(req, res, next) => {
    getUpCommingMeal(req as GetUpCommingMealRequest, res).catch(next);
})

export default resultRouter;