const express = require('express');
const { getDb } = require('../db/database');
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
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const sort = parseSort(req.query.sort, ALLOWED_SORT) || { col: 'created_date', dir: 'DESC' };
  const { conditions, values } = buildWhere(req.query, ALLOWED_COLS);

  let sql = 'SELECT * FROM bookings';
  if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
  sql += ` ORDER BY ${sort.col} ${sort.dir}`;

  const rows = db.prepare(sql).all(...values);
  const visible = rows.filter(b => canReadBooking(req.user, b));
  res.json(visible);
});

// GET /api/entities/bookings/:id
router.get('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'not_found' });
  if (!canReadBooking(req.user, booking)) return res.status(403).json({ error: 'forbidden' });
  res.json(booking);
});

// POST /api/entities/bookings
router.post('/', requireAuth, (req, res) => {
  const db = getDb();
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
  db.prepare(`
    INSERT INTO bookings
      (id, course_id, course_title, user_email, user_name, status, notes, price_paid, created_by, created_date)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, course_id, course_title, user_email,
    req.body.user_name || null,
    req.body.status || 'confirmed',
    req.body.notes || null,
    req.body.price_paid ?? 0,
    req.user.email, now
  );

  res.status(201).json(db.prepare('SELECT * FROM bookings WHERE id = ?').get(id));
});

// PATCH /api/entities/bookings/:id
router.patch('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'not_found' });
  if (!canWriteBooking(req.user, booking)) return res.status(403).json({ error: 'forbidden' });

  const editable = ['status', 'notes', 'price_paid'];
  const updates = {};
  for (const key of editable) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (Object.keys(updates).length === 0) return res.json(booking);

  const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE bookings SET ${sets} WHERE id = ?`).run(...Object.values(updates), req.params.id);

  res.json(db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id));
});

// DELETE /api/entities/bookings/:id
router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'not_found' });
  if (!canWriteBooking(req.user, booking)) return res.status(403).json({ error: 'forbidden' });

  db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
