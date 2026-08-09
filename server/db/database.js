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
  if (initialized) return Promise.resolve(pool);
  initialized = true;

  pool = new Pool({
    connectionString: DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  console.log('Database pool initialized');

  // Initialize schema and test connection — return promise that resolves when complete
  return (async () => {
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

      // First: migrate old level values to new study year values (including NULL)
      try {
        await pool.query("UPDATE courses SET level = 'Alle Studienjahre' WHERE level IS NULL OR level NOT IN ('Alle Studienjahre','ab 1. Studienjahr','ab 2. Studienjahr','ab 3. Studienjahr','ab 4. Studienjahr','ab 5. Studienjahr','ab 6. Studienjahr')");
        await pool.query("UPDATE courses SET level = 'Alle Studienjahre' WHERE level = 'Alle Level'");
        await pool.query("UPDATE courses SET level = 'ab 1. Studienjahr' WHERE level = 'Anfänger'");
        await pool.query("UPDATE courses SET level = 'ab 3. Studienjahr' WHERE level = 'Fortgeschritten'");
        await pool.query("UPDATE courses SET level = 'ab 5. Studienjahr' WHERE level = 'Experte'");
        await pool.query("UPDATE course_templates SET level = 'Alle Studienjahre' WHERE level IS NULL OR level NOT IN ('Alle Studienjahre','ab 1. Studienjahr','ab 2. Studienjahr','ab 3. Studienjahr','ab 4. Studienjahr','ab 5. Studienjahr','ab 6. Studienjahr')");
        await pool.query("UPDATE course_templates SET level = 'Alle Studienjahre' WHERE level = 'Alle Level'");
        await pool.query("UPDATE course_templates SET level = 'ab 1. Studienjahr' WHERE level = 'Anfänger'");
        await pool.query("UPDATE course_templates SET level = 'ab 3. Studienjahr' WHERE level = 'Fortgeschritten'");
        await pool.query("UPDATE course_templates SET level = 'ab 5. Studienjahr' WHERE level = 'Experte'");
        console.log('✓ Level values fixed');
      } catch (err) {
        console.log('⚠ Level migration failed:', err.message);
      }

      // Second: Now update the CHECK constraints
      try {
        await pool.query(`ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_level_check CASCADE`);
        await pool.query(`ALTER TABLE courses ADD CONSTRAINT courses_level_check
          CHECK (level IN ('Alle Studienjahre','ab 1. Studienjahr','ab 2. Studienjahr','ab 3. Studienjahr','ab 4. Studienjahr','ab 5. Studienjahr','ab 6. Studienjahr'))`);
        console.log('✓ courses CHECK constraint updated');
      } catch (err) {
        console.log('⚠ courses CHECK constraint update failed:', err.message);
      }

      try {
        await pool.query(`ALTER TABLE course_templates DROP CONSTRAINT IF EXISTS course_templates_level_check CASCADE`);
        await pool.query(`ALTER TABLE course_templates ADD CONSTRAINT course_templates_level_check
          CHECK (level IN ('Alle Studienjahre','ab 1. Studienjahr','ab 2. Studienjahr','ab 3. Studienjahr','ab 4. Studienjahr','ab 5. Studienjahr','ab 6. Studienjahr'))`);
        console.log('✓ course_templates CHECK constraint updated');
      } catch (err) {
        console.log('⚠ course_templates CHECK constraint update failed:', err.message);
      }

      console.log('✓ Migrations applied');
    } catch (err) {
      console.error('⚠ Database error:', err.message);
    }
  })();
}

module.exports = { getPool, initDb };
