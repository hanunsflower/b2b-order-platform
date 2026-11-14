import bcrypt from 'bcryptjs';
import pool from './db.js';

const email = 'admin@example.com';
const password = process.env.ADMIN_PASSWORD || 'Admin12345';

const hash = await bcrypt.hash(password, 10);

await pool.query(
  `INSERT INTO users (email, password_hash, business_name, role, status)
   VALUES ($1, $2, 'Supplier HQ', 'admin', 'approved')
   ON CONFLICT (email) DO UPDATE
   SET password_hash = EXCLUDED.password_hash, role = 'admin', status = 'approved'`,
  [email, hash]
);

console.log(`Admin ready: ${email}`);
await pool.end();