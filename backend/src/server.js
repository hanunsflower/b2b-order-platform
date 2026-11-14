import express from 'express';
import pool from './db/db.js';
import { requireAuth, requireRole } from './middleware/auth.js';
import authRouter from './modules/auth/auth.routes.js';
import adminRouter from './modules/admin/admin.routes.js';
import productsRouter from './modules/products/products.routes.js';
import cartRouter from './modules/cart/cart.routes.js';
import ordersRouter from './modules/orders/orders.routes.js';

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

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);

// Temporary test routes (we'll remove these later)
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});
app.get('/api/admin-only', requireAuth, requireRole('admin'), (req, res) => {
  res.json({ message: 'Welcome, admin' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));