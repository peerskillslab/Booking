const express = require('express');
const { getPool } = require('../db/database');
const { authenticate, requireRole } = require('../middleware/authenticate');

const router = express.Router();
router.use(authenticate);

const LEVELS = [
  'Alle Studienjahre', 'ab 1. Studienjahr', 'ab 2. Studienjahr', 'ab 3. Studienjahr',
  'ab 4. Studienjahr', 'ab 5. Studienjahr', 'ab 6. Studienjahr',
];
const MAX_NAME = 60;
const MAX_TEXT = 5000;

// Prüft und normalisiert die bearbeitbaren Felder. Gibt { error } oder { fields } zurück.
function readFields(body, { requireName }) {
  const fields = {};
  if (body.name !== undefined || requireName) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > MAX_NAME) return { error: 'invalid_name' };
    fields.name = name;
  }
  for (const key of ['short_description', 'description']) {
    if (body[key] !== undefined) {
      if (typeof body[key] !== 'string' || body[key].length > MAX_TEXT) return { error: `invalid_${key}` };
      fields[key] = body[key];
    }
  }
  if (body.level !== undefined) {
    if (!LEVELS.includes(body.level)) return { error: 'invalid_level' };
    fields.level = body.level;
  }
  if (body.sort_order !== undefined) {
    if (!Number.isInteger(body.sort_order)) return { error: 'invalid_sort_order' };
    fields.sort_order = body.sort_order;
  }
  if (body.active !== undefined) {
    if (typeof body.active !== 'boolean') return { error: 'invalid_active' };
    fields.active = body.active;
  }
  return { fields };
}

// GET /api/categories — öffentlich (Kursliste, Filter). Nur aktive Kategorien,
// ausser Admins fragen mit ?all=1 (dann inkl. inaktive und Nutzungszahlen).
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const all = req.query.all === '1' && req.user?.role === 'admin';
    const result = all
      ? await pool.query(`
          SELECT c.*,
            (SELECT COUNT(*)::int FROM courses WHERE category = c.name) AS course_count,
            (SELECT COUNT(*)::int FROM tutor_categories WHERE category = c.name) AS tutor_count
          FROM course_categories c ORDER BY c.sort_order, c.name`)
      : await pool.query(`
          SELECT name, short_description, description, level, sort_order, active
          FROM course_categories WHERE active ORDER BY sort_order, name`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/categories — Admin. Neue Kategorie kommt ans Ende der Liste.
router.post('/', requireRole('admin'), async (req, res) => {
  const { error, fields } = readFields(req.body || {}, { requireName: true });
  if (error) return res.status(400).json({ error });
  try {
    const pool = getPool();
    const result = await pool.query(`
      INSERT INTO course_categories (name, short_description, description, level, sort_order, active)
      VALUES ($1, $2, $3, $4,
        COALESCE($5, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM course_categories WHERE sort_order < 1000)),
        COALESCE($6, TRUE))
      ON CONFLICT (name) DO NOTHING
      RETURNING *
    `, [fields.name, fields.short_description ?? null, fields.description ?? null,
        fields.level ?? 'Alle Studienjahre', fields.sort_order ?? null, fields.active ?? null]);
    if (!result.rows[0]) return res.status(409).json({ error: 'name_taken' });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/categories/:name — Admin. Beim Umbenennen ziehen Kurse und
// Vorlagen mit (gleiche Transaktion), die Kursrechte über ON UPDATE CASCADE.
router.patch('/:name', requireRole('admin'), async (req, res) => {
  const { error, fields } = readFields(req.body || {}, { requireName: false });
  if (error) return res.status(400).json({ error });
  const keys = Object.keys(fields);
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query('SELECT * FROM course_categories WHERE name = $1 FOR UPDATE', [req.params.name]);
    if (!current.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'not_found' });
    }
    if (keys.length === 0) {
      await client.query('ROLLBACK');
      return res.json(current.rows[0]);
    }
    const renaming = fields.name !== undefined && fields.name !== req.params.name;
    if (renaming) {
      const taken = await client.query('SELECT 1 FROM course_categories WHERE name = $1', [fields.name]);
      if (taken.rows[0]) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'name_taken' });
      }
    }
    const set = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const updated = await client.query(
      `UPDATE course_categories SET ${set} WHERE name = $${keys.length + 1} RETURNING *`,
      [...keys.map((k) => fields[k]), req.params.name]
    );
    if (renaming) {
      await client.query('UPDATE courses SET category = $1 WHERE category = $2', [fields.name, req.params.name]);
      await client.query('UPDATE course_templates SET category = $1 WHERE category = $2', [fields.name, req.params.name]);
    }
    await client.query('COMMIT');
    res.json(updated.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// DELETE /api/categories/:name — Admin. Nur wenn kein Kurs sie nutzt,
// sonst deaktivieren (Kurse speichern den Namen, die Historie bliebe sonst ohne Kategorie).
router.delete('/:name', requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool();
    const used = await pool.query('SELECT COUNT(*)::int AS n FROM courses WHERE category = $1', [req.params.name]);
    if (used.rows[0].n > 0) return res.status(409).json({ error: 'category_in_use', courses: used.rows[0].n });
    const result = await pool.query('DELETE FROM course_categories WHERE name = $1', [req.params.name]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'not_found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
