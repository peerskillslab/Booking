const express = require('express');
const { getPool } = require('../db/database');
const { authenticate, requireAuth } = require('../middleware/authenticate');
const { canReadTemplate, canWriteTemplate } = require('../middleware/authorize');
const { newId, parseSort } = require('../utils');

const router = express.Router();
router.use(authenticate);

// GET /api/entities/coursetemplates
router.get('/', requireAuth, async (req, res) => {
  if (!canReadTemplate(req.user)) return res.status(403).json({ error: 'forbidden' });
  try {
    const pool = getPool();
    const sort = parseSort(req.query.sort, ['created_date','title']) || { col: 'created_date', dir: 'DESC' };
    const result = await pool.query(`SELECT * FROM course_templates ORDER BY ${sort.col} ${sort.dir}`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/entities/coursetemplates/:id
router.get('/:id', requireAuth, async (req, res) => {
  if (!canReadTemplate(req.user)) return res.status(403).json({ error: 'forbidden' });
  try {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM course_templates WHERE id = $1', [req.params.id]);
    const tpl = result.rows[0];
    if (!tpl) return res.status(404).json({ error: 'not_found' });
    res.json(tpl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/entities/coursetemplates
router.post('/', requireAuth, async (req, res) => {
  if (!canReadTemplate(req.user)) return res.status(403).json({ error: 'forbidden' });
  try {
    const pool = getPool();
    const { title, category, ...rest } = req.body;
    if (!title || !category) return res.status(400).json({ error: 'title und category sind erforderlich' });

    const id = newId();
    const now = new Date().toISOString();
    const result = await pool.query(`
      INSERT INTO course_templates
        (id, title, description, short_description, category, duration_minutes,
         max_participants, location, image_url, level, session_count, created_by, created_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `, [
      id, title, rest.description || null, rest.short_description || null, category,
      rest.duration_minutes || null, rest.max_participants || null, rest.location || null,
      rest.image_url || null, rest.level || 'Alle Studienjahre', rest.session_count || 1, req.user.email, now
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/entities/coursetemplates/:id
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const resultSelect = await pool.query('SELECT * FROM course_templates WHERE id = $1', [req.params.id]);
    const tpl = resultSelect.rows[0];
    if (!tpl) return res.status(404).json({ error: 'not_found' });
    if (!canWriteTemplate(req.user, tpl)) return res.status(403).json({ error: 'forbidden' });

    const editable = ['title','description','short_description','category','duration_minutes','max_participants','location','image_url','level','session_count'];
    const updates = {};
    for (const key of editable) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (Object.keys(updates).length === 0) return res.json(tpl);

    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    values.push(req.params.id);
    const placeholderCount = keys.length;

    const resultUpdate = await pool.query(`UPDATE course_templates SET ${setClause} WHERE id = $${placeholderCount + 1}`, values);

    const resultFinal = await pool.query('SELECT * FROM course_templates WHERE id = $1', [req.params.id]);
    res.json(resultFinal.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/entities/coursetemplates/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const resultSelect = await pool.query('SELECT * FROM course_templates WHERE id = $1', [req.params.id]);
    const tpl = resultSelect.rows[0];
    if (!tpl) return res.status(404).json({ error: 'not_found' });
    if (!canWriteTemplate(req.user, tpl)) return res.status(403).json({ error: 'forbidden' });

    await pool.query('DELETE FROM course_templates WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
