import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './models/index.js';
import dishRoutes from './routes/dish.js'
import passport from 'passport';
import session from 'express-session';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft'; // Fix this import
import jwt from 'jsonwebtoken';
import WishList from './models/wishList.js';
// import {serveSwagger, setupSwagger} from "./config/swagger.js";
import authRoutes from './routes/auth.js';
import canteenRoutes from './routes/canteen.js';
import {serveSwagger, setupSwagger} from "./config/swagger.js";
import categoryRoutes from './routes/category.js'
import adminRoutes from './routes/admin.js';
import wishesRoutes from './routes/wishes.js';

dotenv.config();

const app = express();

app.use(session({ secret: "SECRET", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Updated Microsoft Strategy
passport.use(new MicrosoftStrategy({
    clientID: process.env.MS_CLIENT_ID,
    clientSecret: process.env.MS_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/microsoft/callback",
    scope: ['user.read'],
    tenant: process.env.MS_TENANT_ID
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
      console.log('Microsoft Profile:', profile);
      
      const email = profile.emails[0].value.toLowerCase();
      const displayName = profile.displayName;
      
      // Check if email is from your school domain
      if (!email.endsWith('@student.cadt.edu.kh') && !email.endsWith('@cadt.edu.kh')) {
        return done(new Error('Only school email addresses are allowed'), null);
      }
      
      // Check if user already exists
      let user = await db.User.findOne({ where: { email: email } });
      let isFirstTime = false;
      
      if (user) {
        // Existing user - check if active
        if (!user.isActive) {
          if (user.role === 'voter') {
            // Reactivate voter account
            user.isActive = true;
            user.isVerified = true;
            await user.save();
          } else {
            return done(new Error('Your account has been deactivated. Please contact an administrator.'), null);
          }
        }
        
        // Make sure existing user is verified
        if (!user.isVerified) {
          user.isVerified = true;
          await user.save();
        }
        
        // Update Microsoft ID if not set
        if (!user.microsoftId) {
          user.microsoftId = profile.id;
          user.displayName = displayName;
          await user.save();
        }
      } else {
        // New user - create but mark as needing graduation date
        isFirstTime = true;
        user = await db.User.create({
          email: email,
          password: null,
          role: 'voter',
          isVerified: true,
          isActive: true,
          microsoftId: profile.id,
          displayName: displayName,
          expectedGraduationDate: null // Will be set later
        });
        
        // Create wishlist for new user
        await WishList.create({
          userId: user.id,
          dishId: null
        });
        
        console.log('New Microsoft user created:', user.id);
      }
      
      // Add flag to indicate if this is first time login
      user.isFirstTimeLogin = isFirstTime;
      
      return done(null, user);
    } catch (error) {
      console.error('Microsoft auth error:', error);
      return done(error, null);
    }
  }
));

// Update the callback route
app.get('/auth/microsoft/callback',
  passport.authenticate('microsoft', { 
    failureRedirect: `${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/login?error=microsoft_auth_failed` 
  }),
  async (req, res) => {
    try {
      // Generate JWT token for the user
      const token = jwt.sign(
        { 
          id: req.user.id, 
          email: req.user.email, 
          role: req.user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Check if user needs to set graduation date
      const needsGraduationDate = req.user.isFirstTimeLogin || !req.user.expectedGraduationDate;
      
      if (needsGraduationDate) {
        // Redirect to graduation date setup page
        res.redirect(`${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/setup-graduation?token=${token}&first_time=${req.user.isFirstTimeLogin || false}`);
      } else {
        // Normal login redirect
        res.redirect(`${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/auth/callback?token=${token}&provider=microsoft`);
      }
    } catch (error) {
      console.error('Token generation error:', error);
      res.redirect(`${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/login?error=token_generation_failed`);
    }
  }
);

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
  async (req, res) => {
    try {
      // Generate JWT token for the user
      const token = jwt.sign(
        { 
          id: req.user.id, 
          email: req.user.email, 
          role: req.user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/auth/callback?token=${token}&provider=microsoft`);
    } catch (error) {
      console.error('Token generation error:', error);
      res.redirect(`${process.env.FRONTEND_URL}:${process.env.FRONT_PORT}/login?error=token_generation_failed`);
    }
  }
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
    await db.sequelize.sync({ force: true }); // Removed force: true to preserve data
    console.log('Database synced');
} catch (err) {
    console.error('DB sync failed:', err);
}

export default app;