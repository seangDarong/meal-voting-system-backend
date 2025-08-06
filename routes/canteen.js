import express from 'express';
import {addDish} from '../controllers/canteen.js';
import { authenticateToken } from '../middlewares/auth.js';
import {upload} from '../middlewares/upload.js';

const canteenRouter = express.Router();

canteenRouter.post('/add', authenticateToken,upload.single('imageFile'), addDish);

export default canteenRouter;
