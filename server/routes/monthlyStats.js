const express = require('express');
const { getPool } = require('../db/database');
const { authenticate, requireRole } = require('../middleware/authenticate');
const { newId, parseSort } = require('../utils');

const router = express.Router();
router.use(authenticate);

// All monthly stat operations are admin-only

// GET /api/entities/monthlystatshots
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool();
    const sort = parseSort(req.query.sort, ['created_date','month_label']) || { col: 'created_date', dir: 'DESC' };
    const result = await pool.query(`SELECT * FROM monthly_stat_snapshots ORDER BY ${sort.col} ${sort.dir}`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/entities/monthlystatshots
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool();
    const { month_label, total_courses, total_participants, total_bookings, tutor_data, course_data, reset_date } = req.body;
    if (!month_label) return res.status(400).json({ error: 'month_label ist erforderlich' });

    const id = newId();
    const now = new Date().toISOString();
    const result = await pool.query(`
      INSERT INTO monthly_stat_snapshots
        (id, month_label, total_courses, total_participants, total_bookings, tutor_data, course_data, reset_date, created_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [id, month_label, total_courses ?? null, total_participants ?? null,
        total_bookings ?? null, tutor_data || null, course_data || null, reset_date || null, now]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE /api/entities/monthlystatshots/:id
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM monthly_stat_snapshots WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
