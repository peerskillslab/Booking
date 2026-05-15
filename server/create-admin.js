// Einmalig ausführen um den ersten Admin-Nutzer anzulegen:
//   node create-admin.js admin@beispiel.ch "Vor Name" geheimesPasswort

require('dotenv').config();
const { initDb, getPool } = require('./db/database');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const [,, email, fullName, password] = process.argv;
if (!email || !password) {
  console.error('Verwendung: node create-admin.js <email> "<Name>" <passwort>');
  process.exit(1);
}

(async () => {
  try {
    await initDb();
    const pool = getPool();

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) {
      // Update existing user to admin
      await pool.query("UPDATE users SET role = 'admin', full_name = $1 WHERE email = $2", [fullName || '', email]);
      console.log(`✓ Nutzer ${email} auf Admin gesetzt.`);
    } else {
      const hash = bcrypt.hashSync(password, 10);
      await pool.query(
        'INSERT INTO users (id, email, password_hash, full_name, role, created_date) VALUES ($1, $2, $3, $4, $5, $6)',
        [randomUUID(), email, hash, fullName || '', 'admin', new Date().toISOString()]
      );
      console.log(`✓ Admin-Nutzer ${email} angelegt.`);
    }
    process.exit(0);
  } catch (err) {
    console.error('✗ Fehler:', err.message);
    process.exit(1);
  }
})();
