const express = require('express');
const { getPool } = require('../db/database');
const { authenticate, requireAuth } = require('../middleware/authenticate');
const { canReadFeedback, canWriteFeedback } = require('../middleware/authorize');
const { newId, parseSort, buildWhere } = require('../utils');

const router = express.Router();
router.use(authenticate);

const ALLOWED_COLS = ['id','course_id','instructor','q3_helpful','q4_recommend','created_date'];
const ALLOWED_SORT = ['created_date','q3_helpful'];

// GET /api/entities/coursefeedbacks
router.get('/', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const sort = parseSort(req.query.sort, ALLOWED_SORT) || { col: 'created_date', dir: 'DESC' };
    const { conditions, values } = buildWhere(req.query, ALLOWED_COLS);

    let sql = `SELECT * FROM course_feedbacks`;
    if (conditions.length) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    sql += ` ORDER BY ${sort.col} ${sort.dir}`;

    const result = await pool.query(sql, values);
    // Apply RLS filter: only return rows the user is allowed to read
    // Also remove user_email (anonymity)
    const visible = result.rows
      .filter(f => canReadFeedback(req.user, f))
      .map(f => {
        const { user_email, ...rest } = f;
        return rest;
      });
    res.json(visible);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/entities/coursefeedbacks/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM course_feedbacks WHERE id = $1', [req.params.id]);
    const feedback = result.rows[0];
    if (!feedback) return res.status(404).json({ error: 'not_found' });
    if (!canReadFeedback(req.user, feedback)) return res.status(403).json({ error: 'forbidden' });

    // Remove user_email (anonymity)
    const { user_email, ...rest } = feedback;
    res.json(rest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/entities/coursefeedbacks
router.post('/', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { course_id, course_title, instructor, q1_good, q2_improve, q3_helpful, q4_recommend } = req.body;

    if (!course_id || !course_title || !instructor) {
      return res.status(400).json({ error: 'course_id, course_title, instructor sind erforderlich' });
    }

    // Check for duplicate: same user can only give feedback once per course
    const dupCheck = await pool.query(
      'SELECT * FROM course_feedbacks WHERE course_id = $1 AND user_email = $2',
      [course_id, req.user.email]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(400).json({ error: 'already_exists', message: 'Du hast bereits Feedback zu diesem Kurs abgegeben' });
    }

    const id = newId();
    const now = new Date().toISOString();
    const result = await pool.query(`
      INSERT INTO course_feedbacks
        (id, course_id, course_title, instructor, user_email, q1_good, q2_improve, q3_helpful, q4_recommend, created_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id, course_id, course_title, instructor, q1_good, q2_improve, q3_helpful, q4_recommend, created_date
    `, [
      id, course_id, course_title, instructor,
      req.user.email, q1_good || null, q2_improve || null, q3_helpful || null, q4_recommend || null,
      now
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/entities/coursefeedbacks/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const resultSelect = await pool.query('SELECT * FROM course_feedbacks WHERE id = $1', [req.params.id]);
    const feedback = resultSelect.rows[0];
    if (!feedback) return res.status(404).json({ error: 'not_found' });
    if (!canWriteFeedback(req.user, feedback)) return res.status(403).json({ error: 'forbidden' });

    await pool.query('DELETE FROM course_feedbacks WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
