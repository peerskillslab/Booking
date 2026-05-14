// Einmalig ausführen um den ersten Admin-Nutzer anzulegen:
//   node create-admin.js admin@beispiel.ch "Vor Name" geheimesPasswort

const { initDb, getDb } = require('./db/database');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const [,, email, fullName, password] = process.argv;
if (!email || !password) {
  console.error('Verwendung: node create-admin.js <email> "<Name>" <passwort>');
  process.exit(1);
}

initDb();
const db = getDb();

const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
if (existing) {
  // Update existing user to admin
  db.prepare("UPDATE users SET role = 'admin', full_name = ? WHERE email = ?").run(fullName || '', email);
  console.log(`Nutzer ${email} auf Admin gesetzt.`);
} else {
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    'INSERT INTO users (id, email, password_hash, full_name, role, created_date) VALUES (?,?,?,?,?,?)'
  ).run(randomUUID(), email, hash, fullName || '', 'admin', new Date().toISOString());
  console.log(`Admin-Nutzer ${email} angelegt.`);
}
db.close();
