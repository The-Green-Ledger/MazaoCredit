const express = require('express');
const cors = require('cors');
const http = require('http');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./config/supabase');
const websocketService = require('../realtime/websocket');

// Route imports
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');
const financialRoutes = require('./routes/financial');

const app = express();
const server = http.createServer(app);

// Initialize WebSocket
websocketService.initialize(server);

// Test Supabase connection
testConnection();

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

// CORS configuration - Allow both Vite and other common dev ports
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
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

// Handle preflight requests
app.options('*', cors());

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/financial', financialRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Sprout-Sell Backend is running!',
    timestamp: new Date().toISOString(),
    services: {
      websocket: !!websocketService,
      supabase: !!process.env.SUPABASE_URL
    }
  });
});

// Demo endpoint - create mock data
app.post('/api/demo/setup', async (req, res) => {
  try {
    const { supabase } = require('./config/supabase');
    
    // Create a demo user if none exists
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    let demoUserId;

    if (!users || users.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('demo123', 12);
      
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
          name: 'Demo Farmer',
          email: 'farmer@demo.com',
          password: hashedPassword,
          role: 'farmer',
          profile: {
            bio: 'Organic farmer specializing in fresh vegetables',
            phone: '+1234567890',
            address: {
              city: 'Demo City',
              state: 'Demo State'
            }
          }
        }])
        .select('id')
        .single();

      if (error) throw error;
      demoUserId = newUser.id;
    } else {
      demoUserId = users[0].id;
    }

    res.json({
      success: true,
      message: 'Demo setup completed',
      data: {
        userId: demoUserId,
        login: {
          email: 'farmer@demo.com',
          password: 'demo123'
        }
      }
    });
  } catch (error) {
    console.error('Demo setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting up demo data',
      error: error.message
    });
  }
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test endpoint working!',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Handle CORS errors
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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`🌱 Sprout-Sell API is ready!`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🎮 Demo setup: POST http://localhost:${PORT}/api/demo/setup`);
  console.log(`🌐 CORS enabled for: ${allowedOrigins.join(', ')}`);
});

module.exports = app;