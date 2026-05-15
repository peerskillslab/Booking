require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS nur für API-Routen: erlaubt localhost (dev) und jede https-Domain (ngrok, prod)
const apiCors = cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);                          // curl / same-origin
    if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);  // lokale Entwicklung
    if (/^https:\/\//.test(origin)) return cb(null, true);      // ngrok / prod (https)
    cb(new Error('CORS: not allowed'));
  },
  credentials: true,
});

app.use(express.json());

// --- API Routes (mit CORS) ---
app.use('/api/setup',                     apiCors, require('./routes/setup'));
app.use('/api/auth',                      apiCors, require('./routes/auth'));
app.use('/api/entities/courses',          apiCors, require('./routes/courses'));
app.use('/api/entities/bookings',         apiCors, require('./routes/bookings'));
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
initDb();
app.listen(PORT, () => {
  console.log(`PeerSkills Server läuft auf http://localhost:${PORT}`);
});
