import express from 'express';
import pool from './db.js';
import authRouter from './routes/auth.js';
import { requireAuth, requireRole } from './middleware/auth.js';

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);

// Health check
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

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/admin-only', requireAuth, requireRole('admin'), (req, res) => {
  res.json({ message: 'Welcome, admin' });
});

app.listen(port, () => console.log(`API running on http://localhost:${port}`));