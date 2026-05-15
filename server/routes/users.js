const express = require('express');
const { getPool } = require('../db/database');
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
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool();
    const sort = parseSort(req.query.sort, ['created_date','email','role']) || { col: 'created_date', dir: 'DESC' };
    const limit = Math.min(parseInt(req.query.limit) || 500, 1000);
    const result = await pool.query(
      `SELECT * FROM users ORDER BY ${sort.col} ${sort.dir} LIMIT $1`,
      [limit]
    );
    res.json(result.rows.map(sanitize));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/entities/users/:id  — admin or own profile
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'forbidden' });
    }
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'not_found' });
    res.json(sanitize(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/entities/users/:id  — admin only (for role changes)
router.patch('/:id', requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool();
    const resultSelect = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    const user = resultSelect.rows[0];
    if (!user) return res.status(404).json({ error: 'not_found' });

    const allowed = ['role', 'full_name', 'studienjahr'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (Object.keys(updates).length === 0) return res.json(sanitize(user));

    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    values.push(req.params.id);
    const placeholderCount = keys.length;

    await pool.query(`UPDATE users SET ${setClause} WHERE id = $${placeholderCount + 1}`, values);

    const resultFinal = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    res.json(sanitize(resultFinal.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/entities/users/:id  — own account or admin
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'forbidden' });
    }
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
