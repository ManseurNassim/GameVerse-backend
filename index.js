const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');
const { logError } = require('./utils/logger');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Behind Render/Vercel proxies: trust the first proxy hop for correct req.ip
// This prevents express-rate-limit from throwing when X-Forwarded-For is present
app.set('trust proxy', 1);

/**
 * Security configuration
 */
app.use(helmet());

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Trop de requêtes, réessayez dans 15 minutes'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Trop de tentatives de connexion, réessayez dans 15 minutes',
  skipSuccessfulRequests: true
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Trop de tentatives d\'inscription, réessayez dans 15 minutes',
  skipSuccessfulRequests: true
});

const resendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: 'Trop de demandes de renvoi, réessayez dans 15 minutes'
});

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'https://game-verse-frontend.vercel.app',
  'https://gameverse.nassimmanseur.fr'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));
// Ensure preflight requests are handled for all routes
app.options('*', cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/gameLibrary");
    console.log("Connecté à MongoDB");
  } catch (error) {
    console.error("Erreur MongoDB:", error.message);
    process.exit(1);
  }
};

/**
 * Routes configuration
 */
app.use('/auth/login_process', authLimiter);
app.use('/auth/register', registerLimiter);
app.use('/auth/resend-verification', resendLimiter);
app.use('/auth', authRoutes);
app.use('/user', generalLimiter, userRoutes);
app.use('/games', generalLimiter, gameRoutes); 

// Global Error Handler
app.use((err, req, res, next) => {
  logError(err.stack);
  const status = err.statusCode || 500;
  res.status(status).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    status: status,
    timestamp: new Date().toISOString()
  });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});