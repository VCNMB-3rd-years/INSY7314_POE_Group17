require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const fs = require('fs');
const https = require('https');
const http = require('http');

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

// ---------------------
// Database Connection
// ---------------------
connectDB();
app.set('trust proxy', 1);



// ---------------------
// Security Middleware
// ---------------------

// Helmet: sets CSP, Frameguard, HSTS, etc.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"], // Avoid unsafe-inline for max protection
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline CSS for React/Vite
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          "https://localhost:5173",
          "https://localhost:5174",
          "https://localhost:5175",
        ],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    frameguard: { action: 'deny' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
    hidePoweredBy: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);



// Legacy XSS protection for old browsers
app.use(helmet.xssFilter());

// Redirect HTTP → HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use(httpsRedirect);
}




// ---------------------
// CORS Configuration
// ---------------------

const corsOptions = {
  origin: [
    "https://localhost:5173",
    "https://localhost:5174",
    "https://localhost:5175",
    "https://127.0.0.1:5173",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["set-cookie"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));




// ---------------------
// Body Parsing & Sanitization
// ---------------------

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Sanitize MongoDB and remove dangerous query operators
app.use(mongoSanitize());


// Sanitize all HTML/JS inputs (XSS-clean)
app.use(xss());




// ---------------------
// Session & Rate Limiting
// ---------------------

app.use(session(sessionConfig));
app.use(checkSessionTimeout);
app.use(rateLimiter);


// ---------------------
// Debug Logging (dev only)
// ---------------------

if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    console.log('Session ID:', req.sessionID);
    console.log('User Session:', req.session?.user ? 'Active' : 'None');
    next();
  });
}



// ---------------------
// Clickjacking & Permissions Policy
// ---------------------

app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );
  next();
});



// ---------------------
// Routes
// ---------------------
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
      sessionTimeout: '30 minutes',
      idleTimeout: '15 minutes',
    },
  });
});



// Root Route
app.get('/', (req, res) => {
  res.json({
    message: 'International Payments API',
    version: '2.0.0',
    status: 'running',
    authentication: 'Session-based (Secure)',
    security: {
      sessionProtection: 'Enabled',
      httpOnlyCookies: 'Enabled',
      CSP: 'Active',
      XSSProtection: 'Helmet + xss-clean',
      Clickjacking: 'Deny',
      IdleTimeout: '15 minutes',
    },
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
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});




// ---------------------
// HTTPS Server Setup
// ---------------------
const PORT = process.env.PORT || 5000;
const httpsOptions = {
  key: fs.readFileSync('./localhost-key.pem'),
  cert: fs.readFileSync('./localhost.pem'),
};

https.createServer(httpsOptions, app).listen(PORT, () => {
  console.log(`HTTPS Server running on https://localhost:${PORT}`);
  console.log(`Health check: https://localhost:${PORT}/api/health`);
});

// HTTP → HTTPS redirect
http
  .createServer((req, res) => {
    res.writeHead(301, { Location: 'https://' + req.headers.host + req.url });
    res.end();
  })
  .listen(80, () => console.log('HTTP redirect to HTTPS enabled'));
