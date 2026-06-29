#!/usr/bin/env node
// Migration script: Convert old level values to new study year values

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://peerskills:PsklDb202439c6b300a1769f5f@peerskills-db.postgres.database.azure.com:5432/peerskills?sslmode=require'
});

const migrations = [
  // courses table
  { table: 'courses', old: 'Alle Level', new: 'Alle Studienjahre' },
  { table: 'courses', old: 'Anfänger', new: 'ab 1. Studienjahr' },
  { table: 'courses', old: 'Fortgeschritten', new: 'ab 3. Studienjahr' },
  { table: 'courses', old: 'Experte', new: 'ab 5. Studienjahr' },
  // course_templates table
  { table: 'course_templates', old: 'Alle Level', new: 'Alle Studienjahre' },
  { table: 'course_templates', old: 'Anfänger', new: 'ab 1. Studienjahr' },
  { table: 'course_templates', old: 'Fortgeschritten', new: 'ab 3. Studienjahr' },
  { table: 'course_templates', old: 'Experte', new: 'ab 5. Studienjahr' },
];

async function migrate() {
  try {
    console.log('Starting level migration...\n');

    for (const { table, old, new: newVal } of migrations) {
      const result = await pool.query(
        `UPDATE ${table} SET level = $1 WHERE level = $2`,
        [newVal, old]
      );
      console.log(`✓ ${table}: '${old}' → '${newVal}' (${result.rowCount} rows)`);
    }

    console.log('\nVerifying migration:');
    const courseRes = await pool.query('SELECT DISTINCT level FROM courses WHERE level IS NOT NULL ORDER BY level');
    console.log('Courses levels:', courseRes.rows.map(r => r.level));

    const templateRes = await pool.query('SELECT DISTINCT level FROM course_templates WHERE level IS NOT NULL ORDER BY level');
    console.log('Template levels:', templateRes.rows.map(r => r.level));

    console.log('\n✅ Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
