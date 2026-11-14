import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../../db/db.js';

export async function register(req, res) {
  const { email, password, businessName } = req.body;

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
    const passwordHash = await bcrypt.hash(password, 10);

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
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, password_hash, role, status FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    const user = result.rows[0];

    const passwordOk = user && await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.status !== 'approved') {
      return res.status(403).json({ error: 'Your account is not approved yet' });
    }

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
}