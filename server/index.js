require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');
const sessionConfig = require('./Config/session');
const rateLimiter = require('./middleware/rateLimit');
const httpsRedirect = require('./middleware/httpsRedirect');
const { checkSessionTimeout } = require('./middleware/sessionAuth');

// Import routes
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customer');
const employeeRoutes = require('./routes/employee');

const app = express();

// Connect to MongoDB
connectDB();

// Trust proxy (needed for secure cookies behind reverse proxy)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  frameguard: { action: 'deny' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

if (process.env.NODE_ENV === 'production') {
  app.use(httpsRedirect);
}

// CORS Configuration (BEFORE session middleware) - UPDATED
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174', 
      'http://localhost:5175',
      'http://127.0.0.1:5173'
    ];
    
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // CRITICAL: Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sanitize inputs to prevent NoSQL injection
app.use(mongoSanitize());

// SESSION MIDDLEWARE - REPLACES JWT
app.use(session(sessionConfig));

// DEBUG: Log session info (REMOVE IN PRODUCTION)
app.use((req, res, next) => {
  console.log('📍 Request:', req.method, req.path);
  console.log('🔐 Session ID:', req.sessionID);
  console.log('👤 Session User:', req.session?.user ? 'YES' : 'NO');
  console.log('🍪 Cookies:', req.headers.cookie ? 'Present' : 'Missing');
  next();
});

// Session timeout check
app.use(checkSessionTimeout);

// Rate Limiting
app.use(rateLimiter);

// Custom security headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/employee', employeeRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    security: {
      authentication: 'Session-based (HTTP-Only Cookies)',
      clickjackingProtection: 'enabled',
      csp: 'enabled',
      xFrameOptions: 'DENY',
      sessionTimeout: '30 minutes',
      idleTimeout: '15 minutes'
    }
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'International Payments API',
    version: '2.0.0',
    status: 'running',
    authentication: 'Session-based (Secure)',
    security: {
      sessionJackingProtection: '✅ Enabled',
      httpOnlyCookies: '✅ Enabled',
      sessionRegeneration: '✅ Enabled',
      sessionTimeout: '✅ 30 minutes',
      idleTimeout: '✅ 15 minutes',
      clickjackingProtection: '✅ Enabled'
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API: http://localhost:${PORT}`);
  console.log(`💚 Health: http://localhost:${PORT}/api/health`);
  console.log('═══════════════════════════════════════════');
  console.log('🔒 SECURITY FEATURES:');
  console.log('  ✅ Session-based Authentication');
  console.log('  ✅ HTTP-Only Cookies (XSS Protection)');
  console.log('  ✅ Session Regeneration on Login');
  console.log('  ✅ Session Timeout: 30 minutes');
  console.log('  ✅ Idle Timeout: 15 minutes');
  console.log('  ✅ Clickjacking Protection');
  console.log('  ✅ CSRF Protection (SameSite Cookies)');
  console.log('═══════════════════════════════════════════');
});