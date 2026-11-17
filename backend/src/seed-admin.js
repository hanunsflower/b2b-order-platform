import bcrypt from 'bcryptjs';
import pool from './db/db.js';

async function seedDemoAccounts() {
  const adminHash = await bcrypt.hash('demo1234', 10);
  await pool.query(
    `INSERT INTO users (email, password_hash, business_name, role, status)
     VALUES ($1, $2, 'Demo Admin', 'admin', 'approved')
     ON CONFLICT (email) DO UPDATE
     SET password_hash = EXCLUDED.password_hash, role = 'admin', status = 'approved'`,
    ['admin@demo.com', adminHash]
  );

  const buyerHash = await bcrypt.hash('demo1234', 10);
  await pool.query(
    `INSERT INTO users (email, password_hash, business_name, role, status)
     VALUES ($1, $2, 'Demo Buyer', 'buyer', 'approved')
     ON CONFLICT (email) DO UPDATE
     SET password_hash = EXCLUDED.password_hash, role = 'buyer', status = 'approved'`,
    ['buyer@demo.com', buyerHash]
  );

  console.log('Demo accounts ready!');
  await pool.end();
}

seedDemoAccounts();