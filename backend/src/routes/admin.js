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

router.patch('/buyers/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // 1. Reject any status that isn't 'approved' or 'rejected' (400)
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'status must be approved or rejected' });
  }

  if (!Number.isInteger(Number(id))) {
  return res.status(400).json({ error: 'id must be a number' });
}

  try {
    // 2. UPDATE users SET status = $1 WHERE id = $2 AND role = 'buyer'
    //    RETURNING id, email, status
    const result = await pool.query(
      `UPDATE users 
       SET status = $1 
       WHERE id = $2 AND role = 'buyer' 
       RETURNING id, email, status`,
      [status, id]
    );

    // 3. If no row came back, return 404 'Buyer not found'
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Buyer not found' });
    }

    // 4. INSERT INTO audit_logs (actor_id, action, entity, entity_id)
    //    actor_id = req.user.id, action = 'buyer_' + status,
    //    entity = 'user', entity_id = the buyer's id
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, entity, entity_id)
       VALUES ($1, $2, 'user', $3)`,
      [req.user.id, `buyer_${status}`, id]
    );

    // 5. Send back the updated buyer
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;