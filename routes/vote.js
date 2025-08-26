import express from 'express';
import {castVote , updateVote} from '../controllers/vote.js';
import { authenticateToken } from '../middlewares/auth.js';
import { authorizeRole } from '../middlewares/authorizeRole.js';
// import { authorize } from 'passport';

const voteRouter = express.Router();

voteRouter.post('/',authenticateToken,authorizeRole('voter'),castVote);
voteRouter.put('/',authenticateToken,authorizeRole('voter'),updateVote);

export default voteRouter;