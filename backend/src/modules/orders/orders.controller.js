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