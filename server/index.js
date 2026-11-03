console.log('=== Starting PeerSkills Server ===');

try {
  require('dotenv').config();
  console.log('✓ dotenv loaded');
} catch (err) {
  console.log('Note: .env file not found (OK in production)');
}

console.log('Loading dependencies...');
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');

console.log('Loading database module...');
let initDb;
try {
  const db = require('./db/database');
  initDb = db.initDb;
  console.log('✓ Database module loaded');
} catch (err) {
  console.error('✗ Database module failed:', err.message);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Hinter dem Azure-Container-Apps-Ingress kommt jede Anfrage von der Envoy-IP.
// Ohne trust proxy teilen sich alle Nutzer:innen einen Rate-Limit-Eimer.
app.set('trust proxy', 1);

console.log(`Port: ${PORT}`);
console.log(`Database: ${process.env.DATABASE_URL ? 'configured' : 'NOT SET'}`);
console.log('=== Setup complete ===');

// CORS nur für API-Routen: erlaubt localhost (dev) und jede https-Domain (ngrok, prod)
const apiCors = cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);                          // curl / same-origin
    if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);  // lokale Entwicklung
    if (/^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return cb(null, true);  // 127.0.0.1
    if (/^https:\/\//.test(origin)) return cb(null, true);      // ngrok / prod (https)
    if (/^http:\/\/\d+\.\d+\.\d+\.\d+/.test(origin)) return cb(null, true);  // IP-Adressen (Hetzner)
    cb(new Error('CORS: not allowed'));
  },
  credentials: true,
});

// gzip für alle Antworten: JavaScript und JSON schrumpfen damit auf rund ein Viertel.
app.use(compression());
app.use(express.json());

// --- Health Check (schnell, blockiert nicht) ---
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// --- API Routes (mit CORS) ---
app.use('/api/auth',                      apiCors, require('./routes/auth'));
app.use('/api/entities/courses',          apiCors, require('./routes/courses'));
app.use('/api/entities/bookings',         apiCors, require('./routes/bookings'));
app.use('/api/entities/users',            apiCors, require('./routes/users'));
app.use('/api/entities/coursetemplates',  apiCors, require('./routes/courseTemplates'));
app.use('/api/entities/monthlystatshots', apiCors, require('./routes/monthlyStats'));
app.use('/api/content',                   apiCors, require('./routes/content'));

// --- JSON 404 for unknown /api/* routes ---
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'not_found', message: 'API endpoint not found' });
});

// --- JSON error handler: ohne ihn liefert Express HTML statt der überall
// sonst genutzten { error } -Form (z.B. bei ungültigem JSON im Body). ---
app.use('/api', (err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'invalid_json' });
  }
  console.error(err);
  res.status(err.status || 500).json({ error: 'Internal server error' });
});

// --- Statische Frontend-Dateien (kein CORS nötig) ---
const DIST = path.join(__dirname, 'public');
console.log(`Frontend path: ${DIST}`);
console.log(`Frontend exists: ${require('fs').existsSync(DIST)}`);

if (require('fs').existsSync(DIST)) {
  console.log('✓ Serving frontend from', DIST);
  app.use(express.static(DIST, {
    setHeaders(res, filePath) {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        // Vite hängt einen Inhalts-Hash an den Dateinamen: Diese Dateien ändern sich nie.
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (filePath.endsWith('.html')) {
        // index.html immer neu prüfen, damit ein Deploy sofort ankommt.
        res.setHeader('Cache-Control', 'no-cache');
      } else {
        // Fotos, Logos: einen Tag zwischenspeichern.
        res.setHeader('Cache-Control', 'public, max-age=86400');
      }
    },
  }));
  // Seitenaufrufe der App bekommen index.html. Fehlende Dateien (z. B. ein
  // gelöschtes Foto) antworten mit 404 statt mit der HTML-Seite.
  app.get('*', (req, res) => {
    if (path.extname(req.path)) return res.status(404).end();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(DIST, 'index.html'));
  });
} else {
  console.warn('⚠ Frontend not found at', DIST);
  app.get('/', (req, res) => res.send('Frontend not found'));
}

// --- Start ---
initDb(); // non-blocking, runs in background
app.listen(PORT, () => {
  console.log(`PeerSkills Server läuft auf http://localhost:${PORT}`);
});
