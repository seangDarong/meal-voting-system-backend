import express from 'express';
import {addDish} from '../controllers/canteen.js';
import { authenticateToken } from '../middlewares/auth.js';
import {upload} from '../middlewares/upload.js';
import { authorizeRole } from '../middlewares/authorizeRole.js';

const canteenRouter = express.Router();

canteenRouter.post('/', authenticateToken,authorizeRole('staff'),upload.single('imageFile'), addDish);

export default canteenRouter;
