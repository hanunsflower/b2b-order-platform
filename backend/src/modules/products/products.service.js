import pool from '../../db/db.js';

export async function createProductWithVariants({ name, brand, description, variants }, actorId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const p = await client.query(
      `INSERT INTO products (name, brand, description)
       VALUES ($1, $2, $3) RETURNING id, name, brand`,
      [name, brand, description]
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