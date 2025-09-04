import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from '@/models/index';
import cookieParser from 'cookie-parser';
//routes
import dishRoutes from '@/routes/dish'
import resultRoutes from '@/routes/result'
import passport from 'passport';
import session from 'express-session';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import jwt from 'jsonwebtoken';
import authRoutes from '@/routes/auth';

import votePollRoutes from '@/routes/votePoll';
import {serveSwagger, setupSwagger} from "@/config/swagger";
import categoryRoutes from '@/routes/category'
import adminRoutes from '@/routes/admin';
import wishesRoutes from '@/routes/wishes';
import microsoftRoutes from '@/routes/microsoft'; 
import { microsoftAuthStrategy, googleAuthStrategy } from '@/controllers/user';
import userRoutes from '@/routes/user';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import googleRoutes from '@/routes/google'; 

import voteRoutes from '@/routes/vote';


import feedbackRoutes from '@/routes/feedback';


dotenv.config();



const app = express();
app.use(cookieParser());

 


app.use(session({ 
    secret: process.env.SESSION_SECRET || "SECRET", 
    resave: false, 
    saveUninitialized: true 
}));

app.use(passport.initialize());
app.use(passport.session());


if (process.env.MS_CLIENT_ID && process.env.MS_CLIENT_SECRET) {
    passport.use(new MicrosoftStrategy({
      clientID: process.env.MS_CLIENT_ID,
      clientSecret: process.env.MS_CLIENT_SECRET,
      callbackURL: process.env.MS_CALLBACK_URL || "http://localhost:3000/auth/microsoft/callback",
      scope: ['user.read'],
      tenant: process.env.MS_TENANT_ID
    }, microsoftAuthStrategy));
  } else {
    console.warn('Microsoft OAuth credentials not found. Microsoft authentication disabled.');
}
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
        },
        googleAuthStrategy //Fuck this shit
      )
    );
  } else {
    console.warn('Google OAuth credentials not found. Google authentication disabled.');
  }

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id:any, done) => {
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
app.use('/api/polls', votePollRoutes);
app.use('/api/categories', categoryRoutes)
app.use('/api/admin', adminRoutes);
app.use('/api/wishes', wishesRoutes);
app.use('/api/feedback', feedbackRoutes);

app.use('/api/user', userRoutes);
app.use('/auth/microsoft', microsoftRoutes); 
app.use('/auth/google', googleRoutes)

app.use('/api/results',resultRoutes);

app.use('/api/votes', voteRoutes);


app.get('/', (req, res) => {
    res.send('Meal Voting API');
});

// Sync DB
(async () => {
    try {
        await db.sequelize.sync({force: true}); // Removed force: true to preserve data
    
        console.log('Database synced');
    } catch (err) {
        console.error('DB sync failed:', err);
    }
    
})();

export default app;