import pool from '../../db/db.js';

export async function addItem(req, res) {
  const { variantId, quantity } = req.body;

  if (!Number.isInteger(variantId) || variantId <= 0 ||
      !Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ error: 'variantId and quantity must be positive integers' });
  }

  try {
    // Find the buyer's cart, or create it if it doesn't exist yet
    const cart = await pool.query(
      `INSERT INTO carts (buyer_id) VALUES ($1)
       ON CONFLICT (buyer_id) DO UPDATE SET buyer_id = EXCLUDED.buyer_id
       RETURNING id`,
      [req.user.id]
    );

    // Add the item, or increase the quantity if it's already in the cart
    await pool.query(
      `INSERT INTO cart_items (cart_id, variant_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, variant_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
      [cart.rows[0].id, variantId, quantity]
    );

    res.status(201).json({ message: 'Added to cart' });
  } catch (err) {
    if (err.code === '23503') { // foreign key violation: variant doesn't exist
      return res.status(404).json({ error: 'Variant not found' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getCart(req, res) {
  try {
    const result = await pool.query(
      `SELECT v.id AS variant_id, p.name, v.shade, v.size, v.sku,
              v.price, ci.quantity,
              (v.price * ci.quantity) AS line_total,
              (v.stock_on_hand - v.stock_reserved) AS available
       FROM carts c
       JOIN cart_items ci ON ci.cart_id = c.id
       JOIN product_variants v ON v.id = ci.variant_id
       JOIN products p ON p.id = v.product_id
       WHERE c.buyer_id = $1
       ORDER BY ci.id`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function removeItem(req, res) {
  const { variantId } = req.params;

  if (!Number.isInteger(Number(variantId))) {
    return res.status(400).json({ error: 'variantId must be a number' });
  }

  try {
    const result = await pool.query(
      `DELETE FROM cart_items
       USING carts
       WHERE cart_items.cart_id = carts.id
         AND carts.buyer_id = $1
         AND cart_items.variant_id = $2`,
      [req.user.id, variantId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Item not in cart' });
    }
    res.json({ message: 'Removed from cart' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}