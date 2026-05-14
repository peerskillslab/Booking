const express = require('express');
const { getDb } = require('../db/database');
const { authenticate, requireAuth } = require('../middleware/authenticate');
const { canReadTemplate, canWriteTemplate } = require('../middleware/authorize');
const { newId, parseSort } = require('../utils');

const router = express.Router();
router.use(authenticate);

// GET /api/entities/coursetemplates
router.get('/', requireAuth, (req, res) => {
  if (!canReadTemplate(req.user)) return res.status(403).json({ error: 'forbidden' });
  const db = getDb();
  const sort = parseSort(req.query.sort, ['created_date','title']) || { col: 'created_date', dir: 'DESC' };
  const rows = db.prepare(`SELECT * FROM course_templates ORDER BY ${sort.col} ${sort.dir}`).all();
  res.json(rows);
});

// GET /api/entities/coursetemplates/:id
router.get('/:id', requireAuth, (req, res) => {
  if (!canReadTemplate(req.user)) return res.status(403).json({ error: 'forbidden' });
  const db = getDb();
  const tpl = db.prepare('SELECT * FROM course_templates WHERE id = ?').get(req.params.id);
  if (!tpl) return res.status(404).json({ error: 'not_found' });
  res.json(tpl);
});

// POST /api/entities/coursetemplates
router.post('/', requireAuth, (req, res) => {
  if (!canReadTemplate(req.user)) return res.status(403).json({ error: 'forbidden' });
  const db = getDb();
  const { title, category, ...rest } = req.body;
  if (!title || !category) return res.status(400).json({ error: 'title und category sind erforderlich' });

  const id = newId();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO course_templates
      (id, title, description, short_description, category, duration_minutes,
       max_participants, location, image_url, level, created_by, created_date)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, title, rest.description || null, rest.short_description || null, category,
    rest.duration_minutes || null, rest.max_participants || null, rest.location || null,
    rest.image_url || null, rest.level || null, req.user.email, now
  );

  res.status(201).json(db.prepare('SELECT * FROM course_templates WHERE id = ?').get(id));
});

// PATCH /api/entities/coursetemplates/:id
router.patch('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const tpl = db.prepare('SELECT * FROM course_templates WHERE id = ?').get(req.params.id);
  if (!tpl) return res.status(404).json({ error: 'not_found' });
  if (!canWriteTemplate(req.user, tpl)) return res.status(403).json({ error: 'forbidden' });

  const editable = ['title','description','short_description','category','duration_minutes','max_participants','location','image_url','level'];
  const updates = {};
  for (const key of editable) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (Object.keys(updates).length === 0) return res.json(tpl);

  const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE course_templates SET ${sets} WHERE id = ?`).run(...Object.values(updates), req.params.id);

  res.json(db.prepare('SELECT * FROM course_templates WHERE id = ?').get(req.params.id));
});

// DELETE /api/entities/coursetemplates/:id
router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const tpl = db.prepare('SELECT * FROM course_templates WHERE id = ?').get(req.params.id);
  if (!tpl) return res.status(404).json({ error: 'not_found' });
  if (!canWriteTemplate(req.user, tpl)) return res.status(403).json({ error: 'forbidden' });

  db.prepare('DELETE FROM course_templates WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
