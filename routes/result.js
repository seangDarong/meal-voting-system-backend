import express from 'express';
import {getTodayVoteResult ,getUpCommingMeal} from '../controllers/votePoll.js';


const resultRouter = express.Router();


resultRouter.get('/today',getTodayVoteResult);
resultRouter.get('/upcomming', getUpCommingMeal);

export default resultRouter;