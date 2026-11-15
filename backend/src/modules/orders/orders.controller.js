import pool from '../../db/db.js';
import { createOrderFromCart } from './orders.service.js';

export async function placeOrder(req, res) {
  const { fulfillmentMethod, deliveryAddress } = req.body;

  if (!['pickup', 'delivery'].includes(fulfillmentMethod)) {
    return res.status(400).json({ error: 'fulfillmentMethod must be pickup or delivery' });
  }
  if (fulfillmentMethod === 'delivery' &&
      (typeof deliveryAddress !== 'string' || deliveryAddress.trim() === '')) {
    return res.status(400).json({ error: 'deliveryAddress is required for delivery' });
  }

  try {
    const order = await createOrderFromCart(
      req.user.id,
      fulfillmentMethod,
      fulfillmentMethod === 'delivery' ? deliveryAddress.trim() : null
    );
    res.status(201).json(order);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function listMyOrders(req, res) {
  try {
    // total is calculated from the items (Decision 5), not stored
    const result = await pool.query(
      `SELECT o.id, o.status, o.fulfillment_method, o.delivery_address, o.created_at,
              SUM(oi.quantity * oi.unit_price) AS total
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.buyer_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function submitPayment(req, res) {
  const { id } = req.params;
  const { referenceNumber } = req.body;

  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ error: 'id must be a number' });
  }
  if (typeof referenceNumber !== 'string' || referenceNumber.trim().length < 4) {
    return res.status(400).json({ error: 'referenceNumber is required (min 4 characters)' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Only the buyer's own order. 404 hides other buyers' orders.
    const order = await client.query(
      `SELECT id, status FROM orders WHERE id = $1 AND buyer_id = $2 FOR UPDATE`,
      [id, req.user.id]
    );
    if (order.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }
    if (!['pending_payment', 'payment_rejected'].includes(order.rows[0].status)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: `Cannot submit payment for an order that is ${order.rows[0].status}` });
    }

    await client.query(
      `INSERT INTO payments (order_id, reference_number) VALUES ($1, $2)`,
      [id, referenceNumber.trim()]
    );
    await client.query(
      `UPDATE orders SET status = 'payment_submitted', updated_at = now() WHERE id = $1`,
      [id]
    );
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity, entity_id, details)
       VALUES ($1, 'payment_submitted', 'order', $2, $3)`,
      [req.user.id, id, JSON.stringify({ referenceNumber: referenceNumber.trim() })]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Payment submitted. Waiting for Admin verification.' });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'This reference number was already used' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
}

export async function cancelOrder(req, res) {
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ error: 'id must be a number' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const order = await client.query(
      'SELECT id, status FROM orders WHERE id = $1 AND buyer_id = $2 FOR UPDATE',
      [id, req.user.id]
    );
    if (order.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }
    // payment_submitted is excluded: an admin may be reviewing it right now
    if (!['pending_payment', 'payment_rejected'].includes(order.rows[0].status)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: `Cannot cancel an order that is ${order.rows[0].status}` });
    }

    // Release the held stock (on_hand is untouched, only the hold ends)
    await client.query(
      `UPDATE product_variants v
       SET stock_reserved = v.stock_reserved - oi.quantity
       FROM order_items oi
       WHERE oi.variant_id = v.id AND oi.order_id = $1`,
      [id]
    );
    await client.query(
      `UPDATE orders SET status = 'cancelled', updated_at = now() WHERE id = $1`,
      [id]
    );
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity, entity_id)
       VALUES ($1, 'order_cancelled', 'order', $2)`,
      [req.user.id, id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Order cancelled' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
}

export async function getInvoice(req, res) {
  const { id } = req.params;
  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ error: 'id must be a number' });
  }

  try {
    const inv = await pool.query(
      `SELECT i.invoice_number, i.issued_at, o.id AS order_id, o.fulfillment_method
       FROM invoices i
       JOIN orders o ON o.id = i.order_id
       WHERE o.id = $1 AND o.buyer_id = $2`,
      [id, req.user.id]
    );
    if (inv.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const items = await pool.query(
      `SELECT v.sku, p.name, v.shade, oi.quantity, oi.unit_price,
              (oi.quantity * oi.unit_price) AS line_total
       FROM order_items oi
       JOIN product_variants v ON v.id = oi.variant_id
       JOIN products p ON p.id = v.product_id
       WHERE oi.order_id = $1
       ORDER BY oi.id`,
      [id]
    );
    const total = items.rows.reduce((s, r) => s + Number(r.line_total), 0);

    res.json({ ...inv.rows[0], items: items.rows, total: total.toFixed(2) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}