const express = require('express');
const { getPool } = require('../db/database');
const { authenticate, requireAuth, requireRole } = require('../middleware/authenticate');
const { canReadCourse, canWriteCourse, canDeleteCourse } = require('../middleware/authorize');
const { newId, parseSort, buildWhere, buildUpdate } = require('../utils');

const router = express.Router();
router.use(authenticate);

const ALLOWED_COLS = [
  'id','title','description','short_description','category','instructor','instructor_email',
  'date','time','duration_minutes','max_participants','current_participants',
  'location','image_url','level','status','kurs_nr','created_by','created_date',
];
const ALLOWED_SORT = ['created_date','date','title','status'];

// Die Kursliste ist öffentlich. Ohne Login gibt es keinen Grund, die
// E-Mail-Adressen der Tutor:innen mitzuliefern.
function stripContactData(user, course) {
  if (user) return course;
  const { created_by, instructor_email, ...rest } = course;
  return rest;
}

/**
 * Ermittelt die Kontaktadresse zur Tutor:in eines Kurses.
 *
 * instructor ist ein Anzeigename. Wird er geändert, muss die Adresse
 * mitwandern — sonst gehen "Tutor kontaktieren"-Mails weiter an die zuvor
 * eingetragene Person. Eine vom Client mitgeschickte Adresse hat Vorrang,
 * wird aber gegen die Nutzertabelle geprüft; sonst wird über den Namen
 * aufgelöst.
 */
async function resolveInstructorEmail(pool, instructor, candidateEmail) {
  if (candidateEmail) {
    const byEmail = await pool.query(
      'SELECT email FROM users WHERE email = $1', [String(candidateEmail).toLowerCase().trim()]
    );
    if (byEmail.rows[0]) return byEmail.rows[0].email;
  }
  if (!instructor) return null;
  const byName = await pool.query(
    'SELECT email FROM users WHERE full_name = $1 ORDER BY created_date ASC LIMIT 1', [instructor]
  );
  return byName.rows[0]?.email ?? null;
}

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
    const visible = result.rows
      .filter(c => canReadCourse(req.user, c))
      .map(c => stripContactData(req.user, c));
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
    res.json(stripContactData(req.user, course));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/entities/courses
router.post('/', requireAuth, requireRole('tutor', 'admin'), async (req, res) => {
  try {
    const pool = getPool();
    const { title, category, date, max_participants, ...rest } = req.body;
    if (!title || !category || !date || !max_participants) {
      return res.status(400).json({ error: 'title, category, date, max_participants sind erforderlich' });
    }
    const maxParticipants = Number(max_participants);
    if (!Number.isInteger(maxParticipants) || maxParticipants < 1 || maxParticipants > 500) {
      return res.status(400).json({ error: 'max_participants muss zwischen 1 und 500 liegen' });
    }

    const id = newId();
    const now = new Date().toISOString();
    const numRes = await pool.query('SELECT COALESCE(MAX(kurs_nr), 0) + 1 AS next FROM courses');
    const kurs_nr = numRes.rows[0].next;
    const instructorEmail = await resolveInstructorEmail(
      pool, rest.instructor, rest.instructor_email
    );
    const result = await pool.query(`
      INSERT INTO courses
        (id, title, description, short_description, category, instructor, instructor_email,
         date, time, duration_minutes, max_participants, current_participants, location,
         image_url, level, status, extra_dates, kurs_nr, created_by, created_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      RETURNING *
    `, [
      id, title, rest.description || null, rest.short_description || null, category,
      rest.instructor || null, instructorEmail || req.user.email,
      date, rest.time || null, rest.duration_minutes || null,
      maxParticipants, 0, rest.location || null,
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

    // current_participants ist bewusst nicht editierbar — der Zähler wird
    // ausschliesslich von den Buchungsrouten innerhalb einer Transaktion geführt.
    const editable = [
      'title','description','short_description','category','instructor','instructor_email',
      'date','time','duration_minutes','max_participants','location',
      'image_url','level','status','extra_dates',
    ];

    // instructor_email wird nie roh aus dem Body übernommen — sonst könnte eine
    // Tutor:in die Kontaktadresse ihres Kurses auf eine beliebige Adresse
    // zeigen lassen. Sie wird ausschliesslich aus der Nutzertabelle aufgelöst,
    // und zwar immer dann, wenn die Tutor:in wechselt.
    const patch = { ...req.body };
    const requestedEmail = patch.instructor_email;
    delete patch.instructor_email;

    if (patch.instructor !== undefined && patch.instructor !== course.instructor) {
      patch.instructor_email = await resolveInstructorEmail(
        pool, patch.instructor, requestedEmail
      );
    }

    const { setClause, values, nextParam } = buildUpdate(patch, editable);
    if (!setClause) return res.json(course);
    values.push(req.params.id);

    // Use RETURNING to avoid second SELECT
    const resultFinal = await pool.query(
      `UPDATE courses SET ${setClause} WHERE id = $${nextParam} RETURNING *`,
      values
    );
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

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Admin: Get emails and delete cascading
      if (req.user.role === 'admin') {
        // Get active participants (1 query instead of 2 separate)
        const emailsResult = await client.query(
          `SELECT DISTINCT user_email FROM bookings WHERE course_id = $1 AND status != 'cancelled'`,
          [req.params.id]
        );
        const emails = emailsResult.rows.map(r => r.user_email).filter(e => e);

        // Delete in transaction
        await client.query('DELETE FROM bookings WHERE course_id = $1', [req.params.id]);
        await client.query('DELETE FROM course_feedbacks WHERE course_id = $1', [req.params.id]);
        await client.query('DELETE FROM courses WHERE id = $1', [req.params.id]);

        await client.query('COMMIT');
        res.json({ ok: true, emails, courseTitle: course.title, courseDate: course.date });
      } else {
        // Tutor: Delete fails if bookings exist (foreign key constraint)
        await client.query('DELETE FROM courses WHERE id = $1', [req.params.id]);
        await client.query('COMMIT');
        res.json({ ok: true });
      }
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch {}
      throw err;
    } finally {
      client.release();
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
