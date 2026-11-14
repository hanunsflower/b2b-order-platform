import pool from '../../db/db.js';

export async function listBuyers(req, res) {
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
}

export async function updateBuyerStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ error: 'id must be a number' });
  }
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'status must be approved or rejected' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE users
       SET status = $1
       WHERE id = $2 AND role = 'buyer'
       RETURNING id, email, status`,
      [status, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Buyer not found' });
    }

    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity, entity_id)
       VALUES ($1, $2, 'user', $3)`,
      [req.user.id, `buyer_${status}`, id]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
}