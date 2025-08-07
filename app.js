import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './models/index.js';
import dishRoutes from './routes/canteen.js'
// import {serveSwagger, setupSwagger} from "./config/swagger.js";
import authRoutes from './routes/auth.js';
import {serveSwagger, setupSwagger} from "./config/swagger.js";
import adminRoutes from './routes/admin.js';



dotenv.config();

const app = express();
const frontURL = process.env.FRONTEND_URL;
console.log('listen from ', frontURL);
app.use(cors({
    origin: frontURL,
}));
app.use(express.json());

app.use('/docs', serveSwagger, setupSwagger);

// Routes

app.use('/api/dishes',dishRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);


app.get('/', (req, res) => {
    res.send('Meal Voting API');
});

// Sync DB
    try {
        await db.sequelize.sync(); // Removed force: true to preserve data

        console.log('Database synced');
    } catch (err) {
        console.error('DB sync failed:', err);
    }
export default app;