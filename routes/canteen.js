import express from 'express';
import {addDish, updateDish, getAllDishes, deleteDish, getAllDishesByCategory} from '../controllers/canteen.js';
import { authenticateToken } from '../middlewares/auth.js';
import {upload} from '../middlewares/upload.js';
import { authorizeRole } from '../middlewares/authorizeRole.js';

const canteenRouter = express.Router();

canteenRouter.post('/', authenticateToken,authorizeRole('staff'),upload.single('imageFile'), addDish);
canteenRouter.put('/:id',authenticateToken,authorizeRole('staff'),upload.single('imageFile'),updateDish);
canteenRouter.get('/',authenticateToken,authorizeRole('staff'),getAllDishes);
canteenRouter.delete('/:id',authenticateToken,authorizeRole('staff'),deleteDish);
canteenRouter.get('/category/:categoryId',authenticateToken,authorizeRole('staff'),getAllDishesByCategory);

export default canteenRouter;
