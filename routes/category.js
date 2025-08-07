import express from 'express';
import {getAllCategory} from '../controllers/category.js';
import { authenticateToken } from '../middlewares/auth.js';
import { authorizeRole } from '../middlewares/authorizeRole.js';

const categoryRouter = express.Router();

categoryRouter.get('/',authenticateToken,authorizeRole('staff'),getAllCategory);

export default categoryRouter;