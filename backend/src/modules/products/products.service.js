import pool from '../../db/db.js';

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export async function createProductWithVariants(
  { name, brand, description, imageUrl, variants },
  actorId
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const p = await client.query(
      `INSERT INTO products (name, brand, description, image_url)
       VALUES ($1, $2, $3, $4) RETURNING id, name, brand, image_url`,
      [name, brand, description, imageUrl || null]
    );
    const product = p.rows[0];

    for (const v of variants) {
      await client.query(
        `INSERT INTO product_variants (product_id, sku, shade, size, price, stock_on_hand)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [product.id, v.sku, v.shade, v.size, v.price, v.stock]
      );
    }

    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity, entity_id)
       VALUES ($1, 'product_created', 'product', $2)`,
      [actorId, product.id]
    );

    await client.query('COMMIT');
    return product;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function setProductImage(productId, imageUrl, actorId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE products SET image_url = $1 WHERE id = $2
       RETURNING id, name, image_url`,
      [imageUrl || null, productId]
    );
    if (result.rows.length === 0) throw httpError(404, 'Product not found');

    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity, entity_id, details)
       VALUES ($1, 'product_image_updated', 'product', $2, $3)`,
      [actorId, productId, JSON.stringify({ image_url: imageUrl || null })]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateVariant(variantId, { price, stockDelta }, actorId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cur = await client.query(
      `SELECT id, price, stock_on_hand, stock_reserved
       FROM product_variants WHERE id = $1 FOR UPDATE`,
      [variantId]
    );
    if (cur.rows.length === 0) throw httpError(404, 'Variant not found');
    const before = cur.rows[0];

    const newPrice = price ?? before.price;
    const newOnHand = before.stock_on_hand + (stockDelta ?? 0);
    if (newOnHand < before.stock_reserved) {
      throw httpError(409, `Cannot go below ${before.stock_reserved} units: they are reserved by open orders`);
    }

    const updated = await client.query(
      `UPDATE product_variants SET price = $1, stock_on_hand = $2
       WHERE id = $3
       RETURNING id, sku, price, stock_on_hand, stock_reserved`,
      [newPrice, newOnHand, variantId]
    );

    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity, entity_id, details)
       VALUES ($1, 'variant_updated', 'variant', $2, $3)`,
      [actorId, variantId, JSON.stringify({
        price: { from: before.price, to: newPrice },
        stock_on_hand: { from: before.stock_on_hand, to: newOnHand },
      })]
    );

    await client.query('COMMIT');
    return updated.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// --- NEW FUNCTION ADDED BELOW ---
export async function setVariantImage(variantId, imageUrl, actorId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE product_variants SET image_url = $1 WHERE id = $2
       RETURNING id, sku, image_url`,
      [imageUrl || null, variantId]
    );
    if (result.rows.length === 0) throw httpError(404, 'Variant not found');

    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity, entity_id, details)
       VALUES ($1, 'variant_image_updated', 'variant', $2, $3)`,
      [actorId, variantId, JSON.stringify({ image_url: imageUrl || null })]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}