// Load environment variables with explicit path
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Debug environment variables loading (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Environment Variables Debug:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('PORT:', process.env.PORT);
  console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('Environment variables loaded:', Object.keys(process.env).filter(key => key.startsWith('MONGODB') || key.startsWith('FRONTEND') || key.startsWith('NODE_ENV') || key.startsWith('PORT')));
}

const cors = require('cors');
const express = require('express');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const walletRoutes = require('./routes/wallet');
const registrationRoutes = require('./routes/registrations');
const otpRoutes = require('./routes/otp');
const adminRoutes = require('./routes/admin');
const tidioRoutes = require('./routes/tidio');
const healthRoutes = require('./routes/health');

const app = express();
const port = Number(process.env.PORT) || 5000;

// Connect to MongoDB
connectDB();

// Rate limiting
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration (before rate limiting)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://gcashv01.vercel.app',
  'https://gcashv02.vercel.app', // New Vercel deployment
  'https://gcach.vercel.app/', // Latest Vercel deployment
  'https://gcashxadminv01.vercel.app', // Admin dashboard domain
  'https://gcach-admin.vercel.app/', // Latest Admin dashboard domain
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174' // Admin dashboard local dev
].filter(Boolean); // Remove undefined values

console.log('🌐 CORS allowed origins:', allowedOrigins);

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health routes BEFORE rate limiting (no limits on keep-alive pings)
app.use('/api/health', healthRoutes);

// Apply rate limiting to other requests
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/registrations', registrationRoutes); // Main registrations endpoint
app.use('/api/phone-registrations', registrationRoutes); // Legacy endpoint
app.use('/api/otp', otpRoutes); // Real SMS OTP system
app.use('/api', registrationRoutes); // For /api/otp and /api/mpin endpoints from registrations
app.use('/api/admin', adminRoutes);
app.use('/api/tidio', tidioRoutes);

app.get('/', (req, res) => {
  res.json({ 
    message: 'GCash Clone API is running',
    database: 'MongoDB',
    timestamp: new Date().toISOString()
  });
});

// Health endpoint handled by healthRoutes

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

