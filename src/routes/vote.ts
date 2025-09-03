import express from 'express';
import {castVote, updateVote } from '@/controllers/vote';
import { authenticateToken } from '@/middlewares/auth';
import { authorizeRole } from '@/middlewares/authorizeRole';

import { CastVoteRequest , UpdateVoteRequest} from '@/types/requests';

const voteRouter = express.Router();

voteRouter.post('/',authenticateToken,authorizeRole('voter'),(req,res,next) => {
    castVote(req as CastVoteRequest, res).catch(next);
});

voteRouter.put('/',authenticateToken,authorizeRole('voter'),(req,res,next) => {
    updateVote(req as UpdateVoteRequest, res).catch(next);
});



export default voteRouter;