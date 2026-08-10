const express = require('express');
const { getPool } = require('../db/database');
const { authenticate, requireAuth } = require('../middleware/authenticate');
const { canReadBooking, canWriteBooking } = require('../middleware/authorize');
const { newId, parseSort, buildWhere, buildUpdate } = require('../utils');

const router = express.Router();
router.use(authenticate);

const ALLOWED_COLS = [
  'id','course_id','course_title','user_email','user_name',
  'status','notes','price_paid','attended','created_by','created_date',
];
const ALLOWED_SORT = ['created_date','status'];

// Kurskontext für die Autorisierung: erlaubt Tutor:innen den Zugriff auf
// Buchungen ihrer eigenen Kurse (Teilnehmendenliste, Anwesenheiten).
function courseContext(row) {
  return { created_by: row.course_created_by, instructor: row.course_instructor };
}

// Die Join-Spalten gehören nicht in die API-Antwort.
function stripCourseContext(row) {
  const { course_created_by, course_instructor, ...rest } = row;
  return rest;
}

// GET /api/entities/bookings
router.get('/', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const sort = parseSort(req.query.sort, ALLOWED_SORT, 'b') || { col: 'b.created_date', dir: 'DESC' };
    const { conditions, values } = buildWhere(req.query, ALLOWED_COLS, 'b');

    let sql = `
      SELECT b.*, u.studienjahr,
             c.created_by AS course_created_by, c.instructor AS course_instructor
      FROM bookings b
      LEFT JOIN users u   ON b.user_email = u.email
      LEFT JOIN courses c ON b.course_id  = c.id`;
    if (conditions.length) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    sql += ` ORDER BY ${sort.col} ${sort.dir}`;

    const result = await pool.query(sql, values);
    const visible = result.rows
      .filter(b => canReadBooking(req.user, b, courseContext(b)))
      .map(stripCourseContext);
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
    const result = await pool.query(`
      SELECT b.*, c.created_by AS course_created_by, c.instructor AS course_instructor
      FROM bookings b LEFT JOIN courses c ON b.course_id = c.id
      WHERE b.id = $1`, [req.params.id]);
    const booking = result.rows[0];
    if (!booking) return res.status(404).json({ error: 'not_found' });
    if (!canReadBooking(req.user, booking, courseContext(booking))) {
      return res.status(403).json({ error: 'forbidden' });
    }
    res.json(stripCourseContext(booking));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/entities/bookings
router.post('/', requireAuth, async (req, res) => {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const { course_id, course_title, user_email } = req.body;
    if (!course_id || !course_title || !user_email) {
      return res.status(400).json({ error: 'course_id, course_title, user_email sind erforderlich' });
    }

    // Only allow booking on own behalf (or admin)
    if (user_email !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'forbidden' });
    }

    // Der Status wird nicht aus dem Body übernommen: sonst liesse sich mit
    // status:"pending" die Kapazitätsprüfung überspringen und die Buchung
    // anschliessend per PATCH auf "confirmed" heben.
    const status = 'confirmed';
    const id = newId();
    const now = new Date().toISOString();

    await client.query('BEGIN');

    const courseRes = await client.query(
      'SELECT current_participants, max_participants FROM courses WHERE id = $1 FOR UPDATE',
      [course_id]
    );
    if (!courseRes.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'course_not_found' });
    }
    const course = courseRes.rows[0];
    if (course.current_participants >= course.max_participants) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'course_full' });
    }

    const result = await client.query(`
      INSERT INTO bookings
        (id, course_id, course_title, user_email, user_name, status, notes, price_paid, created_by, created_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `, [
      id, course_id, course_title, user_email,
      req.body.user_name || null,
      status,
      req.body.notes || null,
      req.body.price_paid ?? 0,
      req.user.email, now
    ]);

    await client.query(
      'UPDATE courses SET current_participants = current_participants + 1 WHERE id = $1',
      [course_id]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    // Verletzung des Unique-Index auf (course_id, user_email)
    if (err.code === '23505') {
      return res.status(409).json({ error: 'already_booked' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// PATCH /api/entities/bookings/:id
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const resultSelect = await pool.query(`
      SELECT b.*, c.date, c.time,
             c.created_by AS course_created_by, c.instructor AS course_instructor
      FROM bookings b JOIN courses c ON b.course_id = c.id
      WHERE b.id = $1`, [req.params.id]);
    const booking = resultSelect.rows[0];
    if (!booking) return res.status(404).json({ error: 'not_found' });
    if (!canWriteBooking(req.user, booking, courseContext(booking))) {
      return res.status(403).json({ error: 'forbidden' });
    }

    // Nur die buchende Person darf Status/Notizen ändern; Kurs-Tutor:innen
    // dürfen ausschliesslich die Anwesenheit setzen.
    const isOwnBooking = booking.user_email === req.user.email;
    const isAdmin = req.user.role === 'admin';

    // Check cancellation deadline (user non-admin only)
    if (req.body.status === 'cancelled' && !isAdmin) {
      const courseStart = new Date(`${booking.date}T${booking.time || '00:00'}`);
      const cutoff = new Date(courseStart.getTime() - 72 * 60 * 60 * 1000);
      if (new Date() > cutoff) {
        return res.status(403).json({ error: 'cancellation_deadline_passed' });
      }
    }

    const editable = ['status', 'notes', 'price_paid', 'attended'];
    const updates = {};
    for (const key of editable) {
      if (req.body[key] === undefined) continue;
      if (key === 'attended') {
        if (req.user.role !== 'admin' && req.user.role !== 'tutor') continue;
      } else if (!isOwnBooking && !isAdmin) {
        continue;
      }
      updates[key] = req.body[key];
    }
    if (Object.keys(updates).length === 0) return res.json(stripCourseContext(booking));

    const { setClause, values, nextParam } = buildUpdate(updates, editable);
    values.push(req.params.id);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Reaktivierung einer stornierten Buchung: dieselbe Kapazitätsprüfung
      // wie beim Anlegen, mit Row-Lock gegen parallele Buchungen.
      if (updates.status === 'confirmed' && booking.status !== 'confirmed') {
        const courseRes = await client.query(
          'SELECT current_participants, max_participants FROM courses WHERE id = $1 FOR UPDATE',
          [booking.course_id]
        );
        const course = courseRes.rows[0];
        if (!course) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'course_not_found' });
        }
        if (course.current_participants >= course.max_participants) {
          await client.query('ROLLBACK');
          return res.status(409).json({ error: 'course_full' });
        }
      }

      const updateRes = await client.query(
        `UPDATE bookings SET ${setClause} WHERE id = $${nextParam} RETURNING *`,
        values
      );
      const updatedBooking = updateRes.rows[0];

      // Keep current_participants in sync when status changes
      if (updates.status && updates.status !== booking.status) {
        if (booking.status === 'confirmed' && updates.status !== 'confirmed') {
          await client.query(
            'UPDATE courses SET current_participants = GREATEST(0, current_participants - 1) WHERE id = $1',
            [booking.course_id]
          );
        } else if (updates.status === 'confirmed' && booking.status !== 'confirmed') {
          await client.query(
            'UPDATE courses SET current_participants = current_participants + 1 WHERE id = $1',
            [booking.course_id]
          );
        }
      }

      await client.query('COMMIT');
      res.json(updatedBooking);
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

// DELETE /api/entities/bookings/:id
// Nur für Admins: Stornierung läuft für alle anderen über PATCH, das die
// 72-Stunden-Frist prüft und die Buchung als Beleg erhält.
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });

    const pool = getPool();
    const resultSelect = await pool.query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
    const booking = resultSelect.rows[0];
    if (!booking) return res.status(404).json({ error: 'not_found' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query('DELETE FROM bookings WHERE id = $1', [req.params.id]);

      if (booking.status === 'confirmed') {
        await client.query(
          'UPDATE courses SET current_participants = GREATEST(0, current_participants - 1) WHERE id = $1',
          [booking.course_id]
        );
      }

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
