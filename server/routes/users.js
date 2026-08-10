const express = require('express');
const { getPool } = require('../db/database');
const { authenticate, requireAuth, requireRole } = require('../middleware/authenticate');
const { parseSort, buildUpdate } = require('../utils');

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

    if (req.body.role !== undefined && !['admin', 'tutor', 'student'].includes(req.body.role)) {
      return res.status(400).json({ error: 'ungültige Rolle' });
    }
    if (req.body.studienjahr !== undefined) {
      const year = Number(req.body.studienjahr);
      if (!Number.isInteger(year) || year < 1 || year > 6) {
        return res.status(400).json({ error: 'studienjahr muss zwischen 1 und 6 liegen' });
      }
    }

    const { setClause, values, nextParam } = buildUpdate(req.body, ['role', 'full_name', 'studienjahr']);
    if (!setClause) return res.json(sanitize(user));
    values.push(req.params.id);

    const resultFinal = await pool.query(
      `UPDATE users SET ${setClause} WHERE id = $${nextParam} RETURNING *`,
      values
    );
    res.json(sanitize(resultFinal.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/entities/users/:id  — own account or admin
router.delete('/:id', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'forbidden' });
    }

    const target = await pool.query('SELECT email, role FROM users WHERE id = $1', [req.params.id]);
    if (!target.rows[0]) return res.status(404).json({ error: 'not_found' });

    // Ohne verbleibenden Admin gäbe es keinen Weg zurück in die Verwaltung.
    if (target.rows[0].role === 'admin') {
      const admins = await pool.query(`SELECT COUNT(*)::int AS n FROM users WHERE role = 'admin'`);
      if (admins.rows[0].n <= 1) return res.status(409).json({ error: 'last_admin' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Offene Buchungen freigeben, sonst zählt current_participants eine
      // Person weiter, die es nicht mehr gibt.
      const freed = await client.query(
        `DELETE FROM bookings WHERE user_email = $1 AND status = 'confirmed' RETURNING course_id`,
        [target.rows[0].email]
      );
      for (const row of freed.rows) {
        await client.query(
          'UPDATE courses SET current_participants = GREATEST(0, current_participants - 1) WHERE id = $1',
          [row.course_id]
        );
      }
      await client.query('DELETE FROM bookings WHERE user_email = $1', [target.rows[0].email]);
      await client.query('DELETE FROM users WHERE id = $1', [req.params.id]);

      await client.query('COMMIT');
      res.json({ ok: true });
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch {}
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
