import express from "express";
import { getTodayVoteResult } from "../controllers/votePoll.js";
import { authenticateToken } from "../middlewares/auth.js";
import { authorizeRole } from "../middlewares/authorizeRole.js";

const resultRouter = express.Router();

resultRouter.get("/today", getTodayVoteResult);

export default resultRouter;
