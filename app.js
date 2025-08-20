import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './models/index.js';
import dishRoutes from './routes/dish.js'
import passport from 'passport';
import session from 'express-session';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import jwt from 'jsonwebtoken';
import authRoutes from './routes/auth.js';
import canteenRoutes from './routes/canteen.js';
import {serveSwagger, setupSwagger} from "./config/swagger.js";
import categoryRoutes from './routes/category.js'
import adminRoutes from './routes/admin.js';
import wishesRoutes from './routes/wishes.js';
import microsoftRoutes from './routes/microsoft.js'; 
import { microsoftAuthStrategy, googleAuthStrategy } from './controllers/user.js';
import userRoutes from './routes/user.js';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import googleRoutes from './routes/google.js'; 

dotenv.config();

const app = express();

app.use(session({ secret: "SECRET", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());


passport.use(new MicrosoftStrategy({
    clientID: process.env.MS_CLIENT_ID,
    clientSecret: process.env.MS_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/microsoft/callback",
    scope: ['user.read'],
    tenant: process.env.MS_TENANT_ID
}, microsoftAuthStrategy));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
}, googleAuthStrategy));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await db.User.findByPk(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

const frontURL = `${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}`;
console.log('listen from ', frontURL);
app.use(cors({
    origin: frontURL,
}));
app.use(express.json());

app.use('/docs', serveSwagger, setupSwagger);

// Routes
app.use('/api/dishes', dishRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/vote-option', canteenRoutes);
app.use('/api/categories', categoryRoutes)
app.use('/api/admin', adminRoutes);
app.use('/api/wishes', wishesRoutes);
app.use('/api/user', userRoutes);
app.use('/auth/microsoft', microsoftRoutes); 
app.use('/auth/google', googleRoutes)

app.get('/', (req, res) => {
    res.send('Meal Voting API');
});

// Sync DB
try {
    await db.sequelize.sync({force: true}); // Changed from force: true to preserve data
    console.log('Database synced');
} catch (err) {
    console.error('DB sync failed:', err);
}

export default app;