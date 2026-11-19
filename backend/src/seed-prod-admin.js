import bcrypt from 'bcryptjs';
import pool from './db.js';

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password || password.length < 12) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters).');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);
await pool.query(
  `INSERT INTO users (email, password_hash, business_name, role, status)
   VALUES ($1, $2, 'Supplier HQ', 'admin', 'approved')
   ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
  [email.toLowerCase(), hash]
);
console.log(`Admin ready: ${email}`);
await pool.end();