import { Router } from 'express';
import pool from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// All routes in this file are admin only
router.use(requireAuth, requireRole('admin'));

router.get('/buyers', async (req, res) => {
  const status = req.query.status || 'pending';
  const allowed = ['pending', 'approved', 'rejected'];
if (!allowed.includes(status)) {
  return res.status(400).json({ error: 'status must be pending, approved or rejected' });
}
  try {
    const result = await pool.query(
        `SELECT id, email, business_name, status 
        FROM users 
        WHERE role = 'buyer' AND status = $1`,
      [status]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;