const express = require('express');
const { getPool } = require('../db/database');
const { authenticate } = require('../middleware/authenticate');
const { requireContentEditor } = require('./content');

const router = express.Router();
router.use(authenticate);

// Das Frontend verkleinert Bilder vor dem Hochladen auf rund 60 KB.
// Die Grenze fängt nur Ausreisser ab.
const MAX_BYTES = 2 * 1024 * 1024;

// Dateityp aus den ersten Bytes bestimmen, nicht aus dem Header des Browsers.
function detectMime(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

// POST /api/images — nur Admins mit Berechtigung «Inhalte bearbeiten».
// Body: die rohen Bilddaten (Content-Type image/*). Antwort: { url }
router.post(
  '/',
  requireContentEditor,
  express.raw({ type: 'image/*', limit: MAX_BYTES }),
  async (req, res) => {
    const buf = req.body;
    if (!Buffer.isBuffer(buf) || buf.length === 0) {
      return res.status(400).json({ error: 'invalid_image' });
    }
    const mime = detectMime(buf);
    if (!mime) return res.status(400).json({ error: 'invalid_image' });
    try {
      const result = await getPool().query(
        'INSERT INTO images (data, mime, created_by) VALUES ($1, $2, $3) RETURNING id',
        [buf, mime, req.user.email]
      );
      res.status(201).json({ url: `/api/images/${result.rows[0].id}` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  }
);

// GET /api/images/:id — öffentlich, die Bilder erscheinen auf den Infoseiten.
router.get('/:id', async (req, res) => {
  if (!/^\d{1,9}$/.test(req.params.id)) return res.status(404).json({ error: 'not_found' });
  try {
    const result = await getPool().query('SELECT data, mime FROM images WHERE id = $1', [req.params.id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'not_found' });
    res.set('Content-Type', row.mime);
    // Bilder ändern sich nie (neuer Upload = neue ID), dürfen also dauerhaft gecacht werden.
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(row.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
