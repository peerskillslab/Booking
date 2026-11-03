const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost/peerskills';
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Erlaubte Werte für courses.level und course_templates.level
const LEVELS = [
  'Alle Studienjahre', 'ab 1. Studienjahr', 'ab 2. Studienjahr', 'ab 3. Studienjahr',
  'ab 4. Studienjahr', 'ab 5. Studienjahr', 'ab 6. Studienjahr',
];
const LEVELS_SQL = LEVELS.map((l) => `'${l}'`).join(',');

// Alte Level-Bezeichnungen aus der Base44-Zeit → heutige Werte
const LEGACY_LEVELS = {
  'Alle Level': 'Alle Studienjahre',
  'Anfänger': 'ab 1. Studienjahr',
  'Fortgeschritten': 'ab 3. Studienjahr',
  'Experte': 'ab 5. Studienjahr',
};

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
      // Kommentarzeilen entfernen statt ganze Anweisungen zu überspringen:
      // Vorher fiel jede Anweisung weg, vor der ein Kommentar stand.
      const statements = schema
        .split(';')
        .map(s => s.split('\n').filter(line => !line.trim().startsWith('--')).join('\n').trim())
        .filter(Boolean);

      for (const statement of statements) {
        await pool.query(statement);
      }
      console.log('✓ Database schema initialized');

      // Level-Werte und CHECK-Constraints nur anfassen, wenn noch Altbestände da
      // sind. Vorher liefen bei jedem Start zehn UPDATEs und die Constraints
      // wurden entfernt und neu angelegt (prüft jedes Mal die ganze Tabelle).
      for (const table of ['courses', 'course_templates']) {
        try {
          const stale = await pool.query(
            `SELECT 1 FROM ${table} WHERE level IS NULL OR level NOT IN (${LEVELS_SQL}) LIMIT 1`
          );
          if (stale.rows.length > 0) {
            for (const [from, to] of Object.entries(LEGACY_LEVELS)) {
              await pool.query(`UPDATE ${table} SET level = $1 WHERE level = $2`, [to, from]);
            }
            await pool.query(
              `UPDATE ${table} SET level = 'Alle Studienjahre' WHERE level IS NULL OR level NOT IN (${LEVELS_SQL})`
            );
            console.log(`✓ ${table}: Level-Werte bereinigt`);
          }

          const def = await pool.query(
            `SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conname = $1`,
            [`${table}_level_check`]
          );
          const current = def.rows[0]?.def || '';
          if (!LEVELS.every((l) => current.includes(l))) {
            await pool.query(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${table}_level_check`);
            await pool.query(`ALTER TABLE ${table} ADD CONSTRAINT ${table}_level_check CHECK (level IN (${LEVELS_SQL}))`);
            console.log(`✓ ${table}: CHECK constraint aktualisiert`);
          }
        } catch (err) {
          console.log(`⚠ ${table} level migration failed:`, err.message);
        }
      }

      // Nutzer:innen löschen scheiterte mit FK-Verletzung, sobald sie je ein
      // Passwort zurückgesetzt hatten.
      try {
        const fk = await pool.query(
          `SELECT confdeltype FROM pg_constraint WHERE conname = 'password_reset_tokens_user_id_fkey'`
        );
        if (fk.rows[0]?.confdeltype !== 'c') {
          await pool.query(`ALTER TABLE password_reset_tokens
            DROP CONSTRAINT IF EXISTS password_reset_tokens_user_id_fkey`);
          await pool.query(`ALTER TABLE password_reset_tokens
            ADD CONSTRAINT password_reset_tokens_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`);
          console.log('✓ password_reset_tokens FK auf ON DELETE CASCADE gesetzt');
        }
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

      // Zusatzberechtigung «Inhalte bearbeiten»: nicht jede Admin-Person soll die
      // Infoseiten ändern dürfen. Beim ersten Anlegen der Spalte bekommen die
      // bestehenden Admins die Berechtigung einmalig, damit niemand ausgesperrt
      // wird. Danach lässt sie sich in der Nutzerverwaltung entziehen.
      try {
        const col = await pool.query(`
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'can_edit_content'
        `);
        if (col.rows.length === 0) {
          await pool.query('ALTER TABLE users ADD COLUMN can_edit_content BOOLEAN NOT NULL DEFAULT FALSE');
          const granted = await pool.query(`UPDATE users SET can_edit_content = TRUE WHERE role = 'admin'`);
          console.log(`✓ users.can_edit_content angelegt (${granted.rowCount} Admin(s) berechtigt)`);
        }
      } catch (err) {
        console.log('⚠ can_edit_content migration failed:', err.message);
      }

      // Monats-Snapshots: einer pro Monat. Öffnen zwei Admins die Statistik
      // gleichzeitig, entstand er bisher doppelt.
      try {
        const dupes = await pool.query(`
          SELECT month_label FROM monthly_stat_snapshots GROUP BY month_label HAVING COUNT(*) > 1
        `);
        if (dupes.rows.length > 0) {
          console.warn('⚠ Doppelte Monats-Snapshots, Unique-Index nicht angelegt:',
            dupes.rows.map(r => r.month_label).join(', '));
        } else {
          await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_snapshots_month
            ON monthly_stat_snapshots(month_label)`);
        }
      } catch (err) {
        console.log('⚠ snapshot unique index migration failed:', err.message);
      }

      console.log('✓ Migrations applied');
    } catch (err) {
      console.error('⚠ Database error:', err.message);
    }
  })();
}

module.exports = { getPool, initDb };
