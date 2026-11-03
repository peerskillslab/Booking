const express = require('express');
const { getPool } = require('../db/database');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();
router.use(authenticate);

// Nur diese Seiten sind bearbeitbar. Neue Seite = hier und im Frontend
// (src/content/defaults.js) eintragen.
const ALLOWED_KEYS = ['tutorwerden', 'faq', 'about'];

const MAX_STRING = 5000;
const MAX_DEPTH = 5;
const MAX_ITEMS = 200;

// Nur Strings, Arrays und einfache Objekte. Alles andere (Zahlen, null,
// Funktionen) hat in Seitentexten nichts verloren.
function isValidContent(value, depth = 0) {
  if (depth > MAX_DEPTH) return false;
  if (typeof value === 'string') return value.length <= MAX_STRING;
  if (Array.isArray(value)) {
    return value.length <= MAX_ITEMS && value.every((v) => isValidContent(v, depth + 1));
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value);
    return keys.length <= MAX_ITEMS && keys.every((k) => isValidContent(value[k], depth + 1));
  }
  return false;
}

// Schreiben dürfen nur Admins mit der Zusatzberechtigung «Inhalte bearbeiten»
// (users.can_edit_content). Eine Admin-Rolle allein reicht nicht.
function requireContentEditor(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'auth_required' });
  if (req.user.role !== 'admin' || !req.user.can_edit_content) {
    return res.status(403).json({ error: 'forbidden' });
  }
  next();
}

function checkKey(req, res, next) {
  if (!ALLOWED_KEYS.includes(req.params.key)) {
    return res.status(404).json({ error: 'not_found' });
  }
  next();
}

// GET /api/content/:key — öffentlich, die Seiten sind auch ohne Login sichtbar.
// Ohne gespeicherten Eintrag kommt value: null, das Frontend nimmt dann die Standardtexte.
router.get('/:key', checkKey, async (req, res) => {
  try {
    const result = await getPool().query(
      'SELECT key, value, updated_by, updated_date FROM site_content WHERE key = $1',
      [req.params.key]
    );
    const row = result.rows[0];
    res.json(row || { key: req.params.key, value: null, updated_by: null, updated_date: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT /api/content/:key — nur Admins mit Berechtigung «Inhalte bearbeiten»
router.put('/:key', checkKey, requireContentEditor, async (req, res) => {
  const value = req.body && req.body.value;
  if (!value || Array.isArray(value) || typeof value !== 'object' || !isValidContent(value)) {
    return res.status(400).json({ error: 'invalid_content' });
  }
  try {
    const result = await getPool().query(`
      INSERT INTO site_content (key, value, updated_by, updated_date)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (key) DO UPDATE
        SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_date = EXCLUDED.updated_date
      RETURNING key, value, updated_by, updated_date
    `, [req.params.key, JSON.stringify(value), req.user.email, new Date().toISOString()]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE /api/content/:key — nur Berechtigte, setzt die Seite auf die Standardtexte zurück
router.delete('/:key', checkKey, requireContentEditor, async (req, res) => {
  try {
    await getPool().query('DELETE FROM site_content WHERE key = $1', [req.params.key]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
