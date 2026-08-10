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

      // Nutzer:innen löschen scheiterte mit FK-Verletzung, sobald sie je ein
      // Passwort zurückgesetzt hatten.
      try {
        await pool.query(`ALTER TABLE password_reset_tokens
          DROP CONSTRAINT IF EXISTS password_reset_tokens_user_id_fkey`);
        await pool.query(`ALTER TABLE password_reset_tokens
          ADD CONSTRAINT password_reset_tokens_user_id_fkey
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`);
        console.log('✓ password_reset_tokens FK auf ON DELETE CASCADE gesetzt');
      } catch (err) {
        console.log('⚠ password_reset_tokens FK migration failed:', err.message);
      }

      // Doppelbuchungen strukturell ausschliessen. Der Index wird nur angelegt,
      // wenn die Daten sauber sind — bestehende Dubletten werden gemeldet,
      // nicht automatisch gelöscht.
      try {
        const dupes = await pool.query(`
          SELECT course_id, user_email, COUNT(*) AS n
          FROM bookings WHERE status <> 'cancelled'
          GROUP BY course_id, user_email HAVING COUNT(*) > 1
        `);
        if (dupes.rows.length > 0) {
          console.warn(
            `⚠ ${dupes.rows.length} doppelte Buchung(en) gefunden — Unique-Index nicht angelegt.`,
            dupes.rows.map(r => `${r.user_email}@${r.course_id} (${r.n}x)`).join(', ')
          );
        } else {
          await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_course_user
            ON bookings(course_id, user_email) WHERE status <> 'cancelled'`);
          console.log('✓ Unique-Index auf bookings(course_id, user_email)');
        }
      } catch (err) {
        console.log('⚠ bookings unique index migration failed:', err.message);
      }

      // instructor war bisher nur ein Anzeigename; die Kontaktadresse wurde
      // aus created_by abgeleitet. Nach einem Tutorwechsel liefen beide
      // auseinander — Mails gingen weiter an die ursprünglich anlegende Person.
      try {
        const filled = await pool.query(`
          UPDATE courses c SET instructor_email = u.email
          FROM users u
          WHERE c.instructor_email IS NULL
            AND c.instructor IS NOT NULL
            AND u.full_name = c.instructor
        `);
        // Kurse, deren instructor zu keinem Konto passt: created_by ist die
        // beste verfügbare Näherung.
        const fallback = await pool.query(`
          UPDATE courses SET instructor_email = created_by
          WHERE instructor_email IS NULL AND created_by IS NOT NULL
        `);
        console.log(`✓ instructor_email gesetzt (${filled.rowCount} über Name, ${fallback.rowCount} über created_by)`);
      } catch (err) {
        console.log('⚠ instructor_email backfill failed:', err.message);
      }

      console.log('✓ Migrations applied');
    } catch (err) {
      console.error('⚠ Database error:', err.message);
    }
  })();
}

module.exports = { getPool, initDb };
