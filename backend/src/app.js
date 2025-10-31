// Core HTTP server and middleware stack
const express = require('express');
const cors = require('cors');
const http = require('http');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Supabase connection (used to verify DB availability at boot)
const { testConnection } = require('./config/supabase');

// Route mounts (organized per domain)
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');
const financialRoutes = require('./routes/financial');

const app = express();
const server = http.createServer(app);

// Attempt a best-effort DB connectivity check (non-fatal)
testConnection();

// Basic API rate limiting to protect the service
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

// CORS configuration — allow specific origins and support credentials
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5173',
  'https://sprout-sell.vercel.app',
  'https://mazao-credit.netlify.app'
];

// Allow additional origins via env (comma-separated), e.g. "https://app.netlify.app,https://preview--site.netlify.app"
if (process.env.ALLOWED_ORIGINS) {
  for (const o of process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)) {
    if (!allowedOrigins.includes(o)) allowedOrigins.push(o);
  }
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.options('*', cors());

// Security, performance, logging, parsing middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple request logger (timestamp + method + path)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Mount routes under /api/* namespaces
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/financial', financialRoutes);

// Lightweight health probe for uptime checks
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Sprout-Sell Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Centralized error handler — includes CORS error specialization
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS Error: Access denied',
      error: err.message
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Catch-all 404 for unknown API routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found'
  });
});

// Boot the HTTP server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`🌱 Sprout-Sell API is ready!`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});