const express = require('express');
const { getPool } = require('../db/database');
const { authenticate, requireAuth } = require('../middleware/authenticate');
const { canReadBooking, canWriteBooking } = require('../middleware/authorize');
const { newId, parseSort, buildWhere } = require('../utils');

const router = express.Router();
router.use(authenticate);

const ALLOWED_COLS = [
  'id','course_id','course_title','user_email','user_name',
  'status','notes','price_paid','created_by','created_date',
];
const ALLOWED_SORT = ['created_date','status'];

// GET /api/entities/bookings
router.get('/', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const sort = parseSort(req.query.sort, ALLOWED_SORT) || { col: 'created_date', dir: 'DESC' };
    const { conditions, values } = buildWhere(req.query, ALLOWED_COLS);

    let sql = 'SELECT b.*, u.studienjahr FROM bookings b LEFT JOIN users u ON b.user_email = u.email';
    if (conditions.length) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    sql += ` ORDER BY ${sort.col} ${sort.dir}`;

    const result = await pool.query(sql, values);
    const visible = result.rows.filter(b => canReadBooking(req.user, b));
    res.json(visible);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/entities/bookings/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
    const booking = result.rows[0];
    if (!booking) return res.status(404).json({ error: 'not_found' });
    if (!canReadBooking(req.user, booking)) return res.status(403).json({ error: 'forbidden' });
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/entities/bookings
router.post('/', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { course_id, course_title, user_email } = req.body;
    if (!course_id || !course_title || !user_email) {
      return res.status(400).json({ error: 'course_id, course_title, user_email sind erforderlich' });
    }

    // Only allow booking on own behalf (or admin)
    if (user_email !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'forbidden' });
    }

    const id = newId();
    const now = new Date().toISOString();
    const result = await pool.query(`
      INSERT INTO bookings
        (id, course_id, course_title, user_email, user_name, status, notes, price_paid, created_by, created_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `, [
      id, course_id, course_title, user_email,
      req.body.user_name || null,
      req.body.status || 'confirmed',
      req.body.notes || null,
      req.body.price_paid ?? 0,
      req.user.email, now
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/entities/bookings/:id
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const resultSelect = await pool.query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
    const booking = resultSelect.rows[0];
    if (!booking) return res.status(404).json({ error: 'not_found' });
    if (!canWriteBooking(req.user, booking)) return res.status(403).json({ error: 'forbidden' });

    if (req.body.status === 'cancelled' && req.user.role !== 'admin') {
      const courseRes = await pool.query('SELECT date, time FROM courses WHERE id = $1', [booking.course_id]);
      const course = courseRes.rows[0];
      if (course) {
        const courseStart = new Date(`${course.date}T${course.time || '00:00'}`);
        const cutoff = new Date(courseStart.getTime() - 72 * 60 * 60 * 1000);
        if (new Date() > cutoff) {
          return res.status(403).json({ error: 'cancellation_deadline_passed' });
        }
      }
    }

    const editable = ['status', 'notes', 'price_paid'];
    const updates = {};
    for (const key of editable) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (Object.keys(updates).length === 0) return res.json(booking);

    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    values.push(req.params.id);
    const placeholderCount = keys.length;

    await pool.query(`UPDATE bookings SET ${setClause} WHERE id = $${placeholderCount + 1}`, values);

    const resultFinal = await pool.query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
    res.json(resultFinal.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/entities/bookings/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const resultSelect = await pool.query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
    const booking = resultSelect.rows[0];
    if (!booking) return res.status(404).json({ error: 'not_found' });
    if (!canWriteBooking(req.user, booking)) return res.status(403).json({ error: 'forbidden' });

    await pool.query('DELETE FROM bookings WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
