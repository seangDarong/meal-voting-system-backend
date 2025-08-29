import express from 'express';
import {getTodayVoteResult} from '@/controllers/votePoll';

import { GetTodayVoteResultRequest } from '@/types/requests';

const resultRouter = express.Router();


resultRouter.get('/today',(req, res, next) => {
    getTodayVoteResult(req as GetTodayVoteResultRequest, res).catch(next);
});

export default resultRouter;