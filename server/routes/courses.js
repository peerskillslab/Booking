const express = require('express');
const { getDb } = require('../db/database');
const { authenticate, requireAuth } = require('../middleware/authenticate');
const { canReadCourse, canWriteCourse, canDeleteCourse } = require('../middleware/authorize');
const { newId, parseSort, buildWhere } = require('../utils');

const router = express.Router();
router.use(authenticate);

const ALLOWED_COLS = [
  'id','title','description','short_description','category','instructor',
  'date','time','duration_minutes','max_participants','current_participants',
  'location','image_url','level','status','created_by','created_date',
];
const ALLOWED_SORT = ['created_date','date','title','status'];

// GET /api/entities/courses
router.get('/', (req, res) => {
  const db = getDb();
  const sort = parseSort(req.query.sort, ALLOWED_SORT) || { col: 'created_date', dir: 'DESC' };
  const { conditions, values } = buildWhere(req.query, ALLOWED_COLS);

  let sql = `SELECT * FROM courses`;
  if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
  sql += ` ORDER BY ${sort.col} ${sort.dir}`;

  const rows = db.prepare(sql).all(...values);
  // Apply RLS filter: only return rows the user is allowed to see
  const visible = rows.filter(c => canReadCourse(req.user, c));
  res.json(visible);
});

// GET /api/entities/courses/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!course) return res.status(404).json({ error: 'not_found' });
  if (!canReadCourse(req.user, course)) return res.status(403).json({ error: 'forbidden' });
  res.json(course);
});

// POST /api/entities/courses
router.post('/', requireAuth, (req, res) => {
  const db = getDb();
  const { title, category, date, max_participants, ...rest } = req.body;
  if (!title || !category || !date || !max_participants) {
    return res.status(400).json({ error: 'title, category, date, max_participants sind erforderlich' });
  }

  const id = newId();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO courses
      (id, title, description, short_description, category, instructor, date, time,
       duration_minutes, max_participants, current_participants, location, image_url,
       level, status, created_by, created_date)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, title, rest.description || null, rest.short_description || null, category,
    rest.instructor || null, date, rest.time || null, rest.duration_minutes || null,
    max_participants, rest.current_participants ?? 0, rest.location || null,
    rest.image_url || null, rest.level || null, rest.status || 'active',
    req.user.email, now
  );

  res.status(201).json(db.prepare('SELECT * FROM courses WHERE id = ?').get(id));
});

// PATCH /api/entities/courses/:id
router.patch('/:id', requireAuth, (req, res) => {
  const db = require('../db/database').getDb();
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!course) return res.status(404).json({ error: 'not_found' });
  if (!canWriteCourse(req.user, course)) return res.status(403).json({ error: 'forbidden' });

  const editable = [
    'title','description','short_description','category','instructor','date','time',
    'duration_minutes','max_participants','current_participants','location',
    'image_url','level','status',
  ];
  const updates = {};
  for (const key of editable) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (Object.keys(updates).length === 0) return res.json(course);

  const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE courses SET ${sets} WHERE id = ?`).run(...Object.values(updates), req.params.id);

  res.json(db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id));
});

// DELETE /api/entities/courses/:id
router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!course) return res.status(404).json({ error: 'not_found' });
  if (!canDeleteCourse(req.user, course)) return res.status(403).json({ error: 'forbidden' });

  db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
