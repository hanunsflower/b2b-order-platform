import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../../db/db.js';
import jwt from 'jsonwebtoken'

const router = Router();

router.post('/register', async (req, res) => {
  const { email, password, businessName } = req.body;

  // 1. Validate input
  if (!email || !password || !businessName) {
    return res.status(400).json({ error: 'email, password and businessName are required' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    // 2. Hash the password (never store the plain one)
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Save as a pending buyer
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, business_name, role, status)
       VALUES ($1, $2, $3, 'buyer', 'pending')
       RETURNING id, email, business_name, status`,
      [email.toLowerCase(), passwordHash, businessName]
    );

    res.status(201).json({
      message: 'Registered. Please wait for Admin approval.',
      user: result.rows[0],
    });
  } catch (err) {
    if (err.code === '23505') { // unique violation
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // 1. Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    // 2. Find the user
    const result = await pool.query(
      'SELECT id, password_hash, role, status FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    const user = result.rows[0];

    // 3. Check the password (same message whether the email or password is wrong)
    const passwordOk = user && await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 4. Check approval
    if (user.status !== 'approved') {
      return res.status(403).json({ error: 'Your account is not approved yet' });
    }

    // 5. Create the token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;