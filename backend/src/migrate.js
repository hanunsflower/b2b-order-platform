import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from './db/db.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

const client = await pool.connect();
try {
  // The table that remembers which files already ran
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);

  const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
  const applied = await client.query('SELECT name FROM schema_migrations');
  const done = new Set(applied.rows.map((r) => r.name));

  for (const file of files) {
    if (done.has(file)) continue;               // already applied, skip

    const sql = await readFile(path.join(dir, file), 'utf8');
    try {
      await client.query('BEGIN');              // each file is all-or-nothing
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`Applied ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`Failed ${file}: ${err.message}`);
      process.exitCode = 1;
      break;
    }
  }
  console.log('Migrations up to date');
} finally {
  client.release();
  await pool.end();
}