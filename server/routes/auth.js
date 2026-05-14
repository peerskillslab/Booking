const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');
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
  const { email, password, full_name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email und password erforderlich' });

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'email_already_registered' });

  const hash = await bcrypt.hash(password, 10);
  const id = newId();
  db.prepare(
    'INSERT INTO users (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)'
  ).run(id, email.toLowerCase().trim(), hash, full_name || '', 'student');

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  res.json({ token: makeToken(user), user: sanitize(user) });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email und password erforderlich' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || !user.password_hash) return res.status(401).json({ error: 'invalid_credentials' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

  res.json({ token: makeToken(user), user: sanitize(user) });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json(sanitize(req.user));
});

// PATCH /api/auth/me
router.patch('/me', requireAuth, async (req, res) => {
  const db = getDb();
  const { full_name, studienjahr, password } = req.body;

  const updates = {};
  if (full_name !== undefined) updates.full_name = full_name;
  if (studienjahr !== undefined) updates.studienjahr = studienjahr;
  if (password) updates.password_hash = await bcrypt.hash(password, 10);

  if (Object.keys(updates).length === 0) return res.json(sanitize(req.user));

  const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE users SET ${sets} WHERE id = ?`).run(...Object.values(updates), req.user.id);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json(sanitize(updated));
});

// POST /api/auth/logout  (client just drops the token; this is a no-op)
router.post('/logout', (req, res) => res.json({ ok: true }));

function sanitize(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

module.exports = router;
