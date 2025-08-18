import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './models/index.js';
import dishRoutes from './routes/dish.js'
import passport from 'passport';
import session from 'express-session';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft'; // Fix this import
import jwt from 'jsonwebtoken';
// import {serveSwagger, setupSwagger} from "./config/swagger.js";
import authRoutes from './routes/auth.js';
import canteenRoutes from './routes/canteen.js';
import {serveSwagger, setupSwagger} from "./config/swagger.js";
import categoryRoutes from './routes/category.js'
import adminRoutes from './routes/admin.js';
import wishesRoutes from './routes/wishes.js';
import { microsoftAuthStrategy, handleMicrosoftCallback } from './controllers/user.js';

dotenv.config();

const app = express();

app.use(session({ secret: "SECRET", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Use the strategy from controller
passport.use(new MicrosoftStrategy({
    clientID: process.env.MS_CLIENT_ID,
    clientSecret: process.env.MS_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/microsoft/callback",
    scope: ['user.read'],
    tenant: process.env.MS_TENANT_ID
}, microsoftAuthStrategy));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await db.User.findByPk(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Microsoft Auth Routes
app.get('/auth/microsoft', passport.authenticate('microsoft'));
app.get('/auth/microsoft/callback',
    passport.authenticate('microsoft', { 
        failureRedirect: `${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/login?error=microsoft_auth_failed` 
    }),
    handleMicrosoftCallback
);


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
    await db.sequelize.sync(); // Removed force: true to preserve data
    console.log('Database synced');
} catch (err) {
    console.error('DB sync failed:', err);
}

export default app;