const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost/peerskills';
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let pool;

function getPool() {
  if (!pool) throw new Error('Database not initialized. Call initDb() first.');
  return pool;
}

async function initDb() {
  pool = new Pool({
    connectionString: DATABASE_URL,
    // Connection pool config
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,  // erhöht von 2000 auf 10000ms
  });

  // Test connection (non-blocking for startup)
  pool.connect()
    .then(client => {
      console.log('✓ Database connected');
      client.release();
    })
    .catch(err => {
      console.error('⚠ Database connection failed:', err.message);
    });

  // Run schema (non-blocking for startup)
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  (async () => {
    try {
      for (const statement of statements) {
        await pool.query(statement);
      }
      console.log('✓ Database schema initialized');

      // Incremental migrations
      await pool.query('ALTER TABLE courses ADD COLUMN IF NOT EXISTS kurs_nr INTEGER');
      console.log('✓ Migrations applied');
    } catch (err) {
      console.error('⚠ Schema/Migration error:', err.message);
    }
  })();

  return pool;
}

module.exports = { getPool, initDb };
