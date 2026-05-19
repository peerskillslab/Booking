const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../db/database');
const { authenticate, requireAuth, JWT_SECRET } = require('../middleware/authenticate');
const { newId } = require('../utils');

const router = express.Router();

// Parse JWT on all auth routes so req.user is populated for /me
router.use(authenticate);
const TOKEN_TTL = '7d';

function makeToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, studienjahr } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email und password erforderlich' });

    const pool = getPool();
    const existingResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingResult.rows.length > 0) return res.status(409).json({ error: 'email_already_registered' });

    const hash = await bcrypt.hash(password, 10);
    const id = newId();
    await pool.query(
      'INSERT INTO users (id, email, password_hash, full_name, role, studienjahr) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, email.toLowerCase().trim(), hash, full_name || '', 'student', studienjahr || 1]
    );

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    const user = userResult.rows[0];
    res.json({ token: makeToken(user), user: sanitize(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email und password erforderlich' });

    const pool = getPool();
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    const user = userResult.rows[0];
    if (!user || !user.password_hash) return res.status(401).json({ error: 'invalid_credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

    res.json({ token: makeToken(user), user: sanitize(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json(sanitize(req.user));
});

// PATCH /api/auth/me
router.patch('/me', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { full_name, studienjahr, password } = req.body;

    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (studienjahr !== undefined) updates.studienjahr = studienjahr;
    if (password) updates.password_hash = await bcrypt.hash(password, 10);

    if (Object.keys(updates).length === 0) return res.json(sanitize(req.user));

    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    values.push(req.user.id);
    const placeholderCount = keys.length;

    await pool.query(`UPDATE users SET ${setClause} WHERE id = $${placeholderCount + 1}`, values);

    const updatedResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const updated = updatedResult.rows[0];
    res.json(sanitize(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout  (client just drops the token; this is a no-op)
router.post('/logout', (req, res) => res.json({ ok: true }));

function sanitize(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

module.exports = router;
