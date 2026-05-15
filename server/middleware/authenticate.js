const jwt = require('jsonwebtoken');
const { getPool } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'peerskills-dev-secret-change-in-production';

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const pool = getPool();
    // Note: This is synchronous middleware, but we need to fetch from async pool
    // For now, we'll use a workaround: store pool reference in req and fetch user later if needed
    // But since authenticate is called on every request, we need to make it async
    pool.query('SELECT * FROM users WHERE id = $1', [payload.sub])
      .then(result => {
        req.user = result.rows[0] || null;
        next();
      })
      .catch(() => {
        req.user = null;
        next();
      });
  } catch {
    req.user = null;
    next();
  }
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'auth_required' });
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'auth_required' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'forbidden' });
    next();
  };
}

module.exports = { authenticate, requireAuth, requireRole, JWT_SECRET };
