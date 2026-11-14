import pool from '../../db/db.js';

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export async function createOrderFromCart(buyerId, fulfillmentMethod, deliveryAddress) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Read the cart and LOCK the variant rows.
    //    ORDER BY v.id means every checkout locks rows in the same order,
    //    which avoids deadlocks between two buyers.
    const cart = await client.query(
      `SELECT c.id AS cart_id, ci.variant_id, ci.quantity, v.sku, v.price,
              (v.stock_on_hand - v.stock_reserved) AS available
       FROM carts c
       JOIN cart_items ci ON ci.cart_id = c.id
       JOIN product_variants v ON v.id = ci.variant_id
       WHERE c.buyer_id = $1
       ORDER BY v.id
       FOR UPDATE OF v`,
      [buyerId]
    );

    if (cart.rows.length === 0) {
      throw httpError(400, 'Your cart is empty');
    }

    // 2. Check stock for every item
    for (const item of cart.rows) {
      if (item.quantity > item.available) {
        throw httpError(409, `Not enough stock for ${item.sku}: only ${item.available} available`);
      }
    }

    // 3. Create the order
    const order = await client.query(
      `INSERT INTO orders (buyer_id, fulfillment_method, delivery_address)
       VALUES ($1, $2, $3)
       RETURNING id, status, fulfillment_method, delivery_address, created_at`,
      [buyerId, fulfillmentMethod, deliveryAddress]
    );
    const orderId = order.rows[0].id;

    // 4. Order items (price snapshot) + reserve stock
    let total = 0;
    for (const item of cart.rows) {
      await client.query(
        `INSERT INTO order_items (order_id, variant_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.variant_id, item.quantity, item.price]
      );
      await client.query(
        `UPDATE product_variants
         SET stock_reserved = stock_reserved + $1
         WHERE id = $2`,
        [item.quantity, item.variant_id]
      );
      total += item.quantity * Number(item.price);
    }

    // 5. Empty the cart
    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.rows[0].cart_id]);

    // 6. Audit log
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity, entity_id)
       VALUES ($1, 'order_created', 'order', $2)`,
      [buyerId, orderId]
    );

    await client.query('COMMIT');
    return { ...order.rows[0], total: total.toFixed(2) };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}