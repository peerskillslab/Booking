const express = require('express');
const { createHash } = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { getPool } = require('../db/database');
const { authenticate, requireAuth, JWT_SECRET } = require('../middleware/authenticate');
const { newId, buildUpdate } = require('../utils');
const { sendResetEmail } = require('../emailService');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per windowMs
  message: 'Too many attempts, please try again later',
  standardHeaders: false,
  legacyHeaders: false,
});

// Nur Passwortwechsel drosseln — sonst würde jedes Profil-Speichern auf das
// gleiche Kontingent einzahlen. Ziel ist das Raten von current_password.
function limitPasswordChange(req, res, next) {
  if (!req.body || !req.body.password) return next();
  return authLimiter(req, res, next);
}

// Parse JWT on all auth routes so req.user is populated for /me
router.use(authenticate);
const TOKEN_TTL = '7d';

// Reset-Token wird nur als Hash gespeichert — ein DB- oder Backup-Leck
// erlaubt sonst die Übernahme jedes Kontos mit offenem Reset.
function hashResetToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function makeToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, full_name, studienjahr } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email und password erforderlich' });
    if (password.length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase().trim())) {
      return res.status(400).json({ error: 'invalid email format' });
    }
    const year = Number(studienjahr ?? 1);
    if (!Number.isInteger(year) || year < 1 || year > 6) {
      return res.status(400).json({ error: 'studienjahr muss zwischen 1 und 6 liegen' });
    }

    const pool = getPool();
    const existingResult = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingResult.rows.length > 0) return res.status(409).json({ error: 'email_already_registered' });

    const hash = await bcrypt.hash(password, 10);
    const id = newId();
    await pool.query(
      'INSERT INTO users (id, email, password_hash, full_name, role, studienjahr) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, email.toLowerCase().trim(), hash, full_name || '', 'student', year]
    );

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    const user = userResult.rows[0];
    res.json({ token: makeToken(user), user: sanitize(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email und password erforderlich' });

    const pool = getPool();
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    const user = userResult.rows[0];
    if (!user || !user.password_hash) return res.status(401).json({ error: 'invalid_credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

    res.json({ token: makeToken(user), user: sanitize(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json(sanitize(req.user));
});

// PATCH /api/auth/me
router.patch('/me', limitPasswordChange, requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { full_name, studienjahr, password, current_password, email } = req.body;

    // If changing password, require and verify current password
    if (password) {
      if (!current_password) {
        return res.status(400).json({ error: 'current_password required to change password' });
      }

      const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
      const user = userResult.rows[0];
      const isValid = await bcrypt.compare(current_password, user.password_hash);

      if (!isValid) {
        return res.status(401).json({ error: 'current_password is incorrect' });
      }
    }

    // If changing email, validate format and uniqueness
    if (email !== undefined) {
      const trimmedEmail = email.toLowerCase().trim();
      if (!trimmedEmail) {
        return res.status(400).json({ error: 'email is required' });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return res.status(400).json({ error: 'invalid email format' });
      }
      // Check uniqueness
      const existing = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [trimmedEmail, req.user.id]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'email_taken' });
      }
    }

    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (studienjahr !== undefined) updates.studienjahr = studienjahr;
    if (password) updates.password_hash = await bcrypt.hash(password, 10);
    if (email !== undefined) updates.email = email.toLowerCase().trim();

    if (Object.keys(updates).length === 0) return res.json(sanitize(req.user));

    const { setClause, values, nextParam } = buildUpdate(updates, ['full_name', 'studienjahr', 'password_hash', 'email']);
    values.push(req.user.id);

    await pool.query(`UPDATE users SET ${setClause} WHERE id = $${nextParam}`, values);

    // If email changed, update denormalized email fields in bookings and course_feedbacks
    if (email !== undefined) {
      const newEmail = email.toLowerCase().trim();
      const oldEmail = req.user.email;
      await pool.query('UPDATE bookings SET user_email = $1 WHERE user_email = $2', [newEmail, oldEmail]);
      await pool.query('UPDATE course_feedbacks SET user_email = $1 WHERE user_email = $2', [newEmail, oldEmail]);
    }

    const updatedResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const updated = updatedResult.rows[0];
    res.json(sanitize(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email erforderlich' });

    const pool = getPool();
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    const user = userResult.rows[0];

    if (user) {
      await pool.query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1 AND used_at IS NULL',
        [user.id]
      );
      const token = newId();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await pool.query(
        'INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
        [newId(), user.id, hashResetToken(token), expiresAt.toISOString()]
      );
      // Basis-URL: explizit konfiguriert, in Produktion aus dem Request ableiten
      // (hinter Azure Container Apps Ingress liefert x-forwarded-proto https),
      // lokal das Vite-Frontend auf 5173 (API läuft separat auf 3001)
      const requestOrigin = `${req.get('x-forwarded-proto') || req.protocol}://${req.get('host')}`;
      const appBaseUrl = process.env.APP_BASE_URL
        || (process.env.NODE_ENV === 'production' ? requestOrigin : 'http://localhost:5173');
      try {
        await sendResetEmail(user.email, token, appBaseUrl);
      } catch (mailErr) {
        console.error('Reset-Mail fehlgeschlagen:', mailErr.message);
      }
    }

    // Immer 200 – kein Hinweis ob E-Mail existiert
    res.json({ message: 'Falls diese E-Mail-Adresse registriert ist, erhältst du in Kürze einen Link.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'token und password erforderlich' });
    if (password.length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' });

    const pool = getPool();
    // Prüfen und Entwerten in einem Statement: zwei parallele Requests kämen
    // sonst beide an der Einmal-Prüfung vorbei.
    const claim = await pool.query(`
      UPDATE password_reset_tokens SET used_at = NOW()
      WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()
      RETURNING user_id
    `, [hashResetToken(token)]);

    if (claim.rows.length === 0) {
      return res.status(400).json({ error: 'Ungültiger, abgelaufener oder bereits verwendeter Link.' });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, claim.rows[0].user_id]);

    res.json({ message: 'Passwort erfolgreich geändert.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function sanitize(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

module.exports = router;
