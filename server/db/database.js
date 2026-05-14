const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Azure App Service: /home ist persistent. Lokal: im server/db/ Verzeichnis.
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'peerskills.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db;

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

function initDb() {
  db = new Database(DB_PATH);
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);
  return db;
}

module.exports = { getDb, initDb };
