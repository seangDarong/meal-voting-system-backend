import express from 'express';
import {addDish, updateDish, getAllDishes, deleteDish, getAllDishesByCategory} from '../controllers/dish.js';
import { authenticateToken } from '../middlewares/auth.js';
import {upload} from '../middlewares/upload.js';
import { authorizeRole } from '../middlewares/authorizeRole.js';

const dishRouter = express.Router();

dishRouter.post('/', authenticateToken,authorizeRole('staff'),upload.single('imageFile'), addDish);
dishRouter.put('/:id',authenticateToken,authorizeRole('staff'),upload.single('imageFile'),updateDish);
dishRouter.get('/',authenticateToken,authorizeRole('staff'),getAllDishes);
dishRouter.delete('/:id',authenticateToken,authorizeRole('staff'),deleteDish);
dishRouter.get('/category/:categoryId',authenticateToken,authorizeRole('staff'),getAllDishesByCategory);

export default dishRouter;
