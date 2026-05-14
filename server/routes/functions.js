const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth } = require('../middleware/authenticate');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();
router.use(authenticate);
router.use(requireAuth);

// POST /api/functions/updateCourseParticipants
// Atomically increments or decrements current_participants using BEGIN IMMEDIATE.
// This prevents race conditions when multiple users book simultaneously.
router.post('/updateCourseParticipants', (req, res) => {
  const { course_id, increment } = req.body;
  if (!course_id || increment === undefined) {
    return res.status(400).json({ error: 'course_id und increment sind erforderlich' });
  }

  const delta = Number(increment);
  if (delta !== 1 && delta !== -1) {
    return res.status(400).json({ error: 'increment muss 1 oder -1 sein' });
  }

  const db = getDb();

  const updateParticipants = db.transaction(() => {
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(course_id);
    if (!course) throw Object.assign(new Error('not_found'), { status: 404 });

    const next = course.current_participants + delta;
    if (next < 0) throw Object.assign(new Error('already_zero'), { status: 409 });
    if (next > course.max_participants) throw Object.assign(new Error('course_full'), { status: 409 });

    db.prepare('UPDATE courses SET current_participants = ? WHERE id = ?').run(next, course_id);
    return { ...course, current_participants: next };
  });

  try {
    const updated = updateParticipants();
    res.json({ success: true, course_id, current_participants: updated.current_participants });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
