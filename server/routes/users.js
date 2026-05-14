const express = require('express');
const { getDb } = require('../db/database');
const { authenticate, requireAuth, requireRole } = require('../middleware/authenticate');
const { parseSort } = require('../utils');

const router = express.Router();
router.use(authenticate);

function sanitize(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

// GET /api/entities/users  — admin only
router.get('/', requireRole('admin'), (req, res) => {
  const db = getDb();
  const sort = parseSort(req.query.sort, ['created_date','email','role']) || { col: 'created_date', dir: 'DESC' };
  const limit = Math.min(parseInt(req.query.limit) || 500, 1000);
  const rows = db.prepare(
    `SELECT * FROM users ORDER BY ${sort.col} ${sort.dir} LIMIT ?`
  ).all(limit);
  res.json(rows.map(sanitize));
});

// GET /api/entities/users/:id  — admin or own profile
router.get('/:id', requireAuth, (req, res) => {
  const db = getDb();
  if (req.params.id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'forbidden' });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'not_found' });
  res.json(sanitize(user));
});

// PATCH /api/entities/users/:id  — admin only (for role changes)
router.patch('/:id', requireRole('admin'), (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'not_found' });

  const allowed = ['role', 'full_name', 'studienjahr'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (Object.keys(updates).length === 0) return res.json(sanitize(user));

  const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE users SET ${sets} WHERE id = ?`).run(...Object.values(updates), req.params.id);

  res.json(sanitize(db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)));
});

// DELETE /api/entities/users/:id  — own account or admin
router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb();
  if (req.params.id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'forbidden' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
