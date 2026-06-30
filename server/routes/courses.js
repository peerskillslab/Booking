const express = require('express');
const { getPool } = require('../db/database');
const { authenticate, requireAuth } = require('../middleware/authenticate');
const { canReadCourse, canWriteCourse, canDeleteCourse } = require('../middleware/authorize');
const { newId, parseSort, buildWhere } = require('../utils');

const router = express.Router();
router.use(authenticate);

const ALLOWED_COLS = [
  'id','title','description','short_description','category','instructor',
  'date','time','duration_minutes','max_participants','current_participants',
  'location','image_url','level','status','kurs_nr','created_by','created_date',
];
const ALLOWED_SORT = ['created_date','date','title','status'];

// GET /api/entities/courses
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const sort = parseSort(req.query.sort, ALLOWED_SORT) || { col: 'created_date', dir: 'DESC' };
    const { conditions, values } = buildWhere(req.query, ALLOWED_COLS);

    let sql = `SELECT * FROM courses`;
    if (conditions.length) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    sql += ` ORDER BY ${sort.col} ${sort.dir}`;

    const result = await pool.query(sql, values);
    // Apply RLS filter: only return rows the user is allowed to see
    const visible = result.rows.filter(c => canReadCourse(req.user, c));
    res.json(visible);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/entities/courses/:id
router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM courses WHERE id = $1', [req.params.id]);
    const course = result.rows[0];
    if (!course) return res.status(404).json({ error: 'not_found' });
    if (!canReadCourse(req.user, course)) return res.status(403).json({ error: 'forbidden' });
    res.json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/entities/courses
router.post('/', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { title, category, date, max_participants, ...rest } = req.body;
    if (!title || !category || !date || !max_participants) {
      return res.status(400).json({ error: 'title, category, date, max_participants sind erforderlich' });
    }

    const id = newId();
    const now = new Date().toISOString();
    const numRes = await pool.query('SELECT COALESCE(MAX(kurs_nr), 0) + 1 AS next FROM courses');
    const kurs_nr = numRes.rows[0].next;
    const result = await pool.query(`
      INSERT INTO courses
        (id, title, description, short_description, category, instructor, date, time,
         duration_minutes, max_participants, current_participants, location, image_url,
         level, status, extra_dates, kurs_nr, created_by, created_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      RETURNING *
    `, [
      id, title, rest.description || null, rest.short_description || null, category,
      rest.instructor || null, date, rest.time || null, rest.duration_minutes || null,
      max_participants, rest.current_participants ?? 0, rest.location || null,
      rest.image_url || null, rest.level || 'Alle Studienjahre', rest.status || 'active',
      rest.extra_dates || null, kurs_nr, req.user.email, now
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/entities/courses/:id
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const resultSelect = await pool.query('SELECT * FROM courses WHERE id = $1', [req.params.id]);
    const course = resultSelect.rows[0];
    if (!course) return res.status(404).json({ error: 'not_found' });
    if (!canWriteCourse(req.user, course)) return res.status(403).json({ error: 'forbidden' });

    const editable = [
      'title','description','short_description','category','instructor','date','time',
      'duration_minutes','max_participants','current_participants','location',
      'image_url','level','status','extra_dates',
    ];
    const updates = {};
    for (const key of editable) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (Object.keys(updates).length === 0) return res.json(course);

    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    values.push(req.params.id);
    const placeholderCount = keys.length;

    await pool.query(`UPDATE courses SET ${setClause} WHERE id = $${placeholderCount + 1}`, values);

    const resultFinal = await pool.query('SELECT * FROM courses WHERE id = $1', [req.params.id]);
    res.json(resultFinal.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/entities/courses/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const resultSelect = await pool.query('SELECT * FROM courses WHERE id = $1', [req.params.id]);
    const course = resultSelect.rows[0];
    if (!course) return res.status(404).json({ error: 'not_found' });
    if (!canDeleteCourse(req.user, course)) return res.status(403).json({ error: 'forbidden' });

    // Admin darf mit Buchungen löschen, Tutor nicht
    if (req.user.role === 'admin') {
      try {
        // Alle (nicht stornierten) Buchungen laden
        const bookingsResult = await pool.query(
          `SELECT DISTINCT user_email FROM bookings WHERE course_id = $1 AND status != 'cancelled'`,
          [req.params.id]
        );
        const emails = bookingsResult.rows.map(r => r.user_email).filter(e => e);

        // Bookings und Feedbacks löschen
        await pool.query('DELETE FROM bookings WHERE course_id = $1', [req.params.id]);
        await pool.query('DELETE FROM course_feedbacks WHERE course_id = $1', [req.params.id]);

        // Kurs löschen
        await pool.query('DELETE FROM courses WHERE id = $1', [req.params.id]);

        res.json({ ok: true, emails, courseTitle: course.title, courseDate: course.date });
      } catch (err) {
        console.error('Admin delete error:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    } else {
      // Tutor: Delete scheitert wenn Buchungen existieren
      await pool.query('DELETE FROM courses WHERE id = $1', [req.params.id]);
      res.json({ ok: true });
    }
  } catch (err) {
    if (err.code === '23503' && err.constraint === 'bookings_course_id_fkey') {
      return res.status(409).json({ error: 'course_has_bookings' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
