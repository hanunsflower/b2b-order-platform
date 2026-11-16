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

export async function listPayments(req, res) {
  const status = req.query.status || 'submitted';

  if (!['submitted', 'verified', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'status must be submitted, verified or rejected' });
  }

  try {
    const result = await pool.query(
      `SELECT p.id, p.order_id, p.reference_number, p.status, p.submitted_at, o.buyer_id
       FROM payments p
       JOIN orders o ON o.id = p.order_id
       WHERE p.status = $1
       ORDER BY p.submitted_at`,
      [status]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function reviewPayment(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ error: 'id must be a number' });
  }
  if (!['verified', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'status must be verified or rejected' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the payment so two admins can't review it at once
    const payment = await client.query(
      'SELECT id, order_id, status FROM payments WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (payment.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Payment not found' });
    }
    if (payment.rows[0].status !== 'submitted') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: `Payment is already ${payment.rows[0].status}` });
    }
    const orderId = payment.rows[0].order_id;

    await client.query(
      'UPDATE payments SET status = $1, verified_by = $2 WHERE id = $3',
      [status, req.user.id, id]
    );

    if (status === 'verified') {
      // Reservation becomes a real deduction: on_hand and reserved both go down
      await client.query(
        `UPDATE product_variants v
         SET stock_on_hand  = v.stock_on_hand  - oi.quantity,
             stock_reserved = v.stock_reserved - oi.quantity
         FROM order_items oi
         WHERE oi.variant_id = v.id AND oi.order_id = $1`,
        [orderId]
      );
      await client.query(
        `UPDATE orders SET status = 'payment_verified', updated_at = now() WHERE id = $1`,
        [orderId]
      );
      await client.query(
        `INSERT INTO invoices (order_id, invoice_number) VALUES ($1, $2)`,
        [orderId, `INV-${String(orderId).padStart(6, '0')}`]
      );
    } else {
      // Rejected: keep the reservation so the buyer can resubmit
      await client.query(
        `UPDATE orders SET status = 'payment_rejected', updated_at = now() WHERE id = $1`,
        [orderId]
      );
    }

    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity, entity_id)
       VALUES ($1, $2, 'payment', $3)`,
      [req.user.id, `payment_${status}`, id]
    );

    await client.query('COMMIT');
    res.json({ message: `Payment ${status}`, orderId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
}

const ORDER_STATUSES = [
  'pending_payment',
  'payment_submitted',
  'payment_verified',
  'payment_rejected',
  'ready_for_pickup',
  'out_for_delivery',
  'completed',
  'cancelled',
];

// NEW: list all orders (optionally filtered by status)
export async function listOrders(req, res) {
  const { status } = req.query;

  if (status && !ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${ORDER_STATUSES.join(', ')}` });
  }

  try {
    const result = await pool.query(
      `SELECT o.id, o.status, o.fulfillment_method, o.delivery_address, o.created_at,
              u.business_name,
              SUM(oi.quantity * oi.unit_price) AS total
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN users u ON u.id = o.buyer_id
       ${status ? 'WHERE o.status = $1' : ''}
       GROUP BY o.id, u.business_name
       ORDER BY o.created_at DESC`,
      status ? [status] : []
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

// Allowed moves. The target depends on pickup vs delivery.
const NEXT_STATUS = {
  payment_verified: { pickup: 'ready_for_pickup', delivery: 'out_for_delivery' },
  ready_for_pickup: { pickup: 'completed' },
  out_for_delivery: { delivery: 'completed' },
};

export async function updateOrderStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ error: 'id must be a number' });
  }
  if (!['ready_for_pickup', 'out_for_delivery', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'status must be ready_for_pickup, out_for_delivery or completed' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const order = await client.query(
      'SELECT id, status, fulfillment_method FROM orders WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (order.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    const { status: current, fulfillment_method: method } = order.rows[0];
    const allowed = NEXT_STATUS[current]?.[method];
    if (allowed !== status) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: `A ${method} order that is ${current} cannot move to ${status}`,
      });
    }

    await client.query(
      'UPDATE orders SET status = $1, updated_at = now() WHERE id = $2',
      [status, id]
    );
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity, entity_id, details)
       VALUES ($1, 'order_status_changed', 'order', $2, $3)`,
      [req.user.id, id, JSON.stringify({ from: current, to: status })]
    );

    await client.query('COMMIT');
    res.json({ message: `Order is now ${status}` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
}