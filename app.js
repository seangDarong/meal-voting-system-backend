import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './models/index.js';
import dishRoutes from './routes/dish.js'
// import {serveSwagger, setupSwagger} from "./config/swagger.js";
import authRoutes from './routes/auth.js';
import canteenRoutes from './routes/canteen.js';
import {serveSwagger, setupSwagger} from "./config/swagger.js";
import categoryRoutes from './routes/category.js'
import adminRoutes from './routes/admin.js';
import wishesRoutes from './routes/wishes.js';




dotenv.config();

const app = express();
const frontURL = `${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}`;
console.log('listen from ', frontURL);
app.use(cors({
    origin: frontURL,
}));
app.use(express.json());

app.use('/docs', serveSwagger, setupSwagger);

// Routes

app.use('/api/dishes',dishRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/vote-option', canteenRoutes);

app.use('/api/categories', categoryRoutes)

app.use('/api/admin', adminRoutes);
app.use('/api/wishes', wishesRoutes);

app.get('/', (req, res) => {
    res.send('Meal Voting API');
});

// Sync DB
    try {
        await db.sequelize.sync({ force: false }); // Removed force: true to preserve data

        console.log('Database synced');
    } catch (err) {
        console.error('DB sync failed:', err);
    }
export default app;