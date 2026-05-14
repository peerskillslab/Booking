const express = require('express');
const { getDb } = require('../db/database');
const { authenticate, requireRole } = require('../middleware/authenticate');
const { newId, parseSort } = require('../utils');

const router = express.Router();
router.use(authenticate);

// All monthly stat operations are admin-only

// GET /api/entities/monthlystatshots
router.get('/', requireRole('admin'), (req, res) => {
  const db = getDb();
  const sort = parseSort(req.query.sort, ['created_date','month_label']) || { col: 'created_date', dir: 'DESC' };
  const rows = db.prepare(`SELECT * FROM monthly_stat_snapshots ORDER BY ${sort.col} ${sort.dir}`).all();
  res.json(rows);
});

// POST /api/entities/monthlystatshots
router.post('/', requireRole('admin'), (req, res) => {
  const db = getDb();
  const { month_label, total_courses, total_participants, total_bookings, tutor_data, course_data, reset_date } = req.body;
  if (!month_label) return res.status(400).json({ error: 'month_label ist erforderlich' });

  const id = newId();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO monthly_stat_snapshots
      (id, month_label, total_courses, total_participants, total_bookings, tutor_data, course_data, reset_date, created_date)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(id, month_label, total_courses ?? null, total_participants ?? null,
    total_bookings ?? null, tutor_data || null, course_data || null, reset_date || null, now);

  res.status(201).json(db.prepare('SELECT * FROM monthly_stat_snapshots WHERE id = ?').get(id));
});

// DELETE /api/entities/monthlystatshots/:id
router.delete('/:id', requireRole('admin'), (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM monthly_stat_snapshots WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
