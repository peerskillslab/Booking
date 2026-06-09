try {
  require('dotenv').config();
} catch (err) {
  console.log('Note: .env file not found (OK in production)');
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3001;

console.log(`Starting PeerSkills Server...`);
console.log(`Port: ${PORT}`);
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'configured' : 'NOT SET'}`);

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

// --- Statische Frontend-Dateien (kein CORS nötig) ---
const DIST = path.join(__dirname, '..', 'peer-skills-lab-kurse', 'dist');
if (require('fs').existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get('*', (req, res) => res.sendFile(path.join(DIST, 'index.html')));
}

// --- Start ---
initDb(); // non-blocking, runs in background
app.listen(PORT, () => {
  console.log(`PeerSkills Server läuft auf http://localhost:${PORT}`);
});
