const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost/peerskills';
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let pool;
let initialized = false;

function getPool() {
  if (!pool) {
    initDb();
  }
  return pool;
}

function initDb() {
  if (initialized) return pool;
  initialized = true;

  pool = new Pool({
    connectionString: DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  console.log('Database pool initialized');

  // Initialize schema and test connection in background (non-blocking)
  (async () => {
    try {
      const client = await pool.connect();
      console.log('✓ Database connected');
      client.release();

      const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

      for (const statement of statements) {
        await pool.query(statement);
      }
      console.log('✓ Database schema initialized');

      await pool.query('ALTER TABLE courses ADD COLUMN IF NOT EXISTS kurs_nr INTEGER');
      await pool.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS attended BOOLEAN DEFAULT FALSE');
      console.log('✓ Migrations applied');
    } catch (err) {
      console.error('⚠ Database error:', err.message);
    }
  })();

  return pool;
}

module.exports = { getPool, initDb };
