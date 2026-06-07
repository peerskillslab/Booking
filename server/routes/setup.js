const express = require('express');
const bcrypt = require('bcryptjs');
const { getPool } = require('../db/database');
const { randomUUID } = require('crypto');

const router = express.Router();

// POST /api/setup/create-admin
// Creates the first admin account if none exists
router.post('/create-admin', async (req, res) => {
  const { email, password, full_name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const pool = getPool();

    // Check if any admin already exists
    const adminResult = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (adminResult.rows.length > 0) {
      return res.status(403).json({ error: 'Admin account already exists' });
    }

    // Check if email is already used
    const existingResult = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingResult.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const id = randomUUID();

    await pool.query(
      'INSERT INTO users (id, email, password_hash, full_name, role, created_date) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, email.toLowerCase().trim(), hash, full_name || '', 'admin', new Date().toISOString()]
    );

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
    console.error('Admin creation error:', error);
    res.status(500).json({ error: 'Failed to create admin account' });
  }
});

module.exports = router;
