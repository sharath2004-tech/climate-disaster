import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import EmergencyAlert from './models/EmergencyAlert.js';

import adminRoutes from './routes/admin.js';
import aiRoutes from './routes/ai.js';
import alertRoutes from './routes/alerts.js';
import authRoutes from './routes/auth.js';
import communityRoutes from './routes/community.js';
import evacuationRoutes from './routes/evacuation.js';
import reportRoutes from './routes/reports.js';
import resourceRoutes from './routes/resources.js';
import userRoutes from './routes/users.js';
import weatherRoutes from './routes/weather.js';

// Load .env from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 10000;

/* --------------------------------------------------
   TRUST PROXY (IMPORTANT FOR CLOUD DEPLOYMENTS)
-------------------------------------------------- */
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

/* --------------------------------------------------
   CORS CONFIGURATION (SAFE & CORRECT)
-------------------------------------------------- */
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8081',
  'https://skynetra.vercel.app',
  'https://climate-disaster.vercel.app',
  'https://climate-disaster.onrender.com',
  'https://climate-disaster-latest.onrender.com',
  // Vercel preview deployments
  /^https:\/\/.*\.vercel\.app$/,
  // Render.com deployments
  /^https:\/\/.*\.onrender\.com$/,
  // Netlify deployments
  /^https:\/\/.*\.netlify\.app$/,
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Check if origin matches allowedOrigins (string or regex)
      const isAllowed = allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') {
          return allowed === origin;
        }
        if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return false;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.error('❌ CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
  })
);

/* --------------------------------------------------
   RATE LIMITING (BASIC SECURITY)
-------------------------------------------------- */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', apiLimiter);

/* --------------------------------------------------
   BODY PARSERS
-------------------------------------------------- */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* --------------------------------------------------
   MONGODB CONNECTION
-------------------------------------------------- */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

/* --------------------------------------------------
   ROUTES
-------------------------------------------------- */
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/evacuation', evacuationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/admin', adminRoutes);

/* --------------------------------------------------
   PUBLIC EMERGENCY ALERTS (NO AUTH)
-------------------------------------------------- */
app.get('/api/emergency-alerts', async (req, res) => {
  try {
    const alerts = await EmergencyAlert.find({ status: 'active' })
      .populate('issuedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(alerts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/* --------------------------------------------------
   HEALTH CHECK
-------------------------------------------------- */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

/* --------------------------------------------------
   GLOBAL ERROR HANDLER
-------------------------------------------------- */
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error'
  });
});

/* --------------------------------------------------
   SERVER START
-------------------------------------------------- */
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

/* --------------------------------------------------
   GRACEFUL SHUTDOWN
-------------------------------------------------- */
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...');
  await mongoose.connection.close();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});