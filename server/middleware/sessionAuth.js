// Session timeout middleware
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes idle timeout

const checkSessionTimeout = (req, res, next) => {
  if (req.session && req.session.user) {
    const now = Date.now();
    const lastActivity = req.session.lastActivity || now;
    const timeSinceLastActivity = now - lastActivity;

    // Check idle timeout
    if (timeSinceLastActivity > IDLE_TIMEOUT) {
      console.log('⏰ Session expired due to inactivity');
      req.session.destroy((err) => {
        if (err) console.error('Session destroy error:', err);
      });
      return res.status(401).json({ 
        error: 'Session expired due to inactivity',
        code: 'SESSION_TIMEOUT'
      });
    }

    // Update last activity time
    req.session.lastActivity = now;
    req.session.touch(); // Update session in store
  }

  next();
};

// Authentication middleware (replaces JWT auth)
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ 
      error: 'Authentication required. Please login.',
      code: 'NOT_AUTHENTICATED'
    });
  }

  // Attach user to request
  req.user = {
    id: req.session.user._id,
    role: req.session.user.role
  };

  next();
};

// Employee-only middleware
const requireEmployee = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.session.user.role !== 'employee') {
    return res.status(403).json({ error: 'Access denied. Employee only.' });
  }

  req.user = {
    id: req.session.user._id,
    role: req.session.user.role
  };

  next();
};

// Session regeneration helper
const regenerateSession = (req) => {
  return new Promise((resolve, reject) => {
    const userData = req.session.user;
    req.session.regenerate((err) => {
      if (err) {
        reject(err);
      } else {
        req.session.user = userData;
        req.session.lastActivity = Date.now();
        req.session.createdAt = Date.now();
        resolve();
      }
    });
  });
};

module.exports = {
  checkSessionTimeout,
  requireAuth,
  requireEmployee,
  regenerateSession,
  SESSION_TIMEOUT,
  IDLE_TIMEOUT
};