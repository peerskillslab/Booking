const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');
const { randomUUID } = require('crypto');

const router = express.Router();

// POST /api/setup/create-admin
// Creates the first admin account if none exists
router.post('/create-admin', async (req, res) => {
  const { email, password, full_name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const db = getDb();

  // Check if any admin already exists
  const adminExists = db.prepare("SELECT id FROM users WHERE role = 'admin'").get();
  if (adminExists) {
    return res.status(403).json({ error: 'Admin account already exists' });
  }

  // Check if email is already used
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const id = randomUUID();
    db.prepare(
      'INSERT INTO users (id, email, password_hash, full_name, role, created_date) VALUES (?,?,?,?,?,?)'
    ).run(id, email.toLowerCase().trim(), hash, full_name || '', 'admin', new Date().toISOString());

    res.json({
      success: true,
      message: `Admin account created for ${email}`,
      user: {
        id,
        email: email.toLowerCase().trim(),
        full_name: full_name || '',
        role: 'admin'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create admin account' });
  }
});

module.exports = router;
