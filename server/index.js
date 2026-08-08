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

app.use(express.json());

// --- Health Check (schnell, blockiert nicht) ---
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// --- API Routes (mit CORS) ---
app.use('/api/setup',                     apiCors, require('./routes/setup'));
app.use('/api/auth',                      apiCors, require('./routes/auth'));
app.use('/api/entities/courses',          apiCors, require('./routes/courses'));
app.use('/api/entities/bookings',         apiCors, require('./routes/bookings'));
app.use('/api/entities/coursefeedbacks',  apiCors, require('./routes/courseFeedbacks'));
app.use('/api/entities/users',            apiCors, require('./routes/users'));
app.use('/api/entities/coursetemplates',  apiCors, require('./routes/courseTemplates'));
app.use('/api/entities/monthlystatshots', apiCors, require('./routes/monthlyStats'));
app.use('/api/functions',                 apiCors, require('./routes/functions'));

// --- JSON 404 for unknown /api/* routes ---
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'not_found', message: 'API endpoint not found' });
});

// --- Statische Frontend-Dateien (kein CORS nötig) ---
const DIST = path.join(__dirname, 'public');
console.log(`Frontend path: ${DIST}`);
console.log(`Frontend exists: ${require('fs').existsSync(DIST)}`);

if (require('fs').existsSync(DIST)) {
  console.log('✓ Serving frontend from', DIST);
  app.use(express.static(DIST));
  app.get('*', (req, res) => res.sendFile(path.join(DIST, 'index.html')));
} else {
  console.warn('⚠ Frontend not found at', DIST);
  app.get('/', (req, res) => res.send('Frontend not found'));
}

// --- Start ---
initDb(); // non-blocking, runs in background
app.listen(PORT, () => {
  console.log(`PeerSkills Server läuft auf http://localhost:${PORT}`);
});
