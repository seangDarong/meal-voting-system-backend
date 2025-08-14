import express from 'express';
import {submitVoteOptions , getActiveVotePoll} from '../controllers/canteen.js';
import { authenticateToken } from '../middlewares/auth.js';
import { authorizeRole } from '../middlewares/authorizeRole.js';

const canteenRouter = express.Router();
canteenRouter.post('/',authenticateToken,authorizeRole('staff'),submitVoteOptions);
canteenRouter.get('/active',getActiveVotePoll);

export default canteenRouter;
