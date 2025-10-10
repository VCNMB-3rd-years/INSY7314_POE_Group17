const session = require('express-session');
const MongoStore = require('connect-mongo');

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-super-secret-session-key-change-in-production-min-32-chars',
  
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 30 * 60,
    autoRemove: 'native',
    touchAfter: 5 * 60
  }),

  cookie: {
    httpOnly: true,
    secure: false, // false for development (http), true for production (https)
    sameSite: 'lax', // CHANGED FROM 'strict' to 'lax'
    maxAge: 30 * 60 * 1000,
    path: '/',
    domain: undefined
  },

  name: 'sessionId',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  
  genid: function(req) {
    return require('crypto').randomBytes(16).toString('hex');
  }
};

module.exports = sessionConfig;