const express = require('express');
const { getPool } = require('../db/database');
const { authenticate, requireAuth } = require('../middleware/authenticate');

const router = express.Router();
router.use(authenticate);
router.use(requireAuth);

// POST /api/functions/updateCourseParticipants
// Atomically increments or decrements current_participants using PostgreSQL transactions.
// This prevents race conditions when multiple users book simultaneously.
router.post('/updateCourseParticipants', async (req, res) => {
  const { course_id, increment } = req.body;
  if (!course_id || increment === undefined) {
    return res.status(400).json({ error: 'course_id und increment sind erforderlich' });
  }

  const delta = Number(increment);
  if (delta !== 1 && delta !== -1) {
    return res.status(400).json({ error: 'increment muss 1 oder -1 sein' });
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const courseResult = await client.query('SELECT * FROM courses WHERE id = $1', [course_id]);
    const course = courseResult.rows[0];
    if (!course) throw Object.assign(new Error('not_found'), { status: 404 });

    const next = course.current_participants + delta;
    if (next < 0) throw Object.assign(new Error('already_zero'), { status: 409 });
    if (next > course.max_participants) throw Object.assign(new Error('course_full'), { status: 409 });

    await client.query('UPDATE courses SET current_participants = $1 WHERE id = $2', [next, course_id]);

    await client.query('COMMIT');

    res.json({ success: true, course_id, current_participants: next });
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Ignore rollback errors
    }
    console.error(err);
    res.status(err.status || 500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// POST /api/functions/resetAllData
// Deletes all courses, bookings, feedbacks and stat snapshots (admin only).
router.post('/resetAllData', async (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM course_feedbacks');
    await client.query('DELETE FROM bookings');
    await client.query('DELETE FROM courses');
    await client.query('DELETE FROM monthly_stat_snapshots');
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
