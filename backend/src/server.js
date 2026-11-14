import express from 'express';
import pool from './db.js';

const app = express();
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT now() AS time');
    res.json({ status: 'ok', dbTime: result.rows[0].time });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Database unreachable' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));