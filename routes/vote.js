import express from 'express';
import {castVote} from '../controllers/vote.js';
import { authenticateToken } from '../middlewares/auth.js';
import { authorizeRole } from '../middlewares/authorizeRole.js';

const voteRouter = express.Router();

voteRouter.post('/',authenticateToken,authorizeRole('voter'),castVote);

export default voteRouter;