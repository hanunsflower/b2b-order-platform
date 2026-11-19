
import pool from './db/db.js';

async function seedCatalog() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // =====================================
    // PRODUCT 1: Almost Lipstick - Clinique
    // =====================================

    const prod1 = await client.query(
      `INSERT INTO products (name, brand, description, image_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [
        'Almost Lipstick',
        'Clinique',
        'A sheer, glossy lip color.',
        'https://plus.unsplash.com/premium_photo-1732707044722-136fca70676b?w=600&auto=format&fit=crop&q=60'
      ]
    );

    let prod1Id;

    if (prod1.rows.length > 0) {
      prod1Id = prod1.rows[0].id;
    } else {
      const existing = await client.query(
        `SELECT product_id AS id
         FROM product_variants
         WHERE sku = $1`,
        ['LIP-NUDE-19']
      );

      prod1Id = existing.rows[0]?.id;
    }

    if (!prod1Id) throw new Error('Could not find Almost Lipstick product.');

    await client.query(
      `UPDATE products
       SET image_url = $1
       WHERE id = $2`,
      [
        'https://plus.unsplash.com/premium_photo-1732707044722-136fca70676b?w=600&auto=format&fit=crop&q=60',
        prod1Id
      ]
    );

    await client.query(
      `INSERT INTO product_variants
       (product_id, sku, shade, size, price, stock_on_hand, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (sku) DO UPDATE
       SET image_url = EXCLUDED.image_url`,
      [
        prod1Id,
        'LIP-NUDE-19',
        'Nude Honey',
        '1.9g',
        1000.00,
        50,
        'https://plus.unsplash.com/premium_photo-1732707044722-136fca70676b?w=600&auto=format&fit=crop&q=60'
      ]
    );


    // =====================================
    // PRODUCT 2: Matte Lipstick - Glow
    // =====================================

    const prod2 = await client.query(
      `INSERT INTO products (name, brand, description, image_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [
        'Matte Lipstick',
        'Glow',
        'Long-lasting matte finish.',
        'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=600&auto=format&fit=crop&q=60'
      ]
    );

    let prod2Id;

    if (prod2.rows.length > 0) {
      prod2Id = prod2.rows[0].id;
    } else {
      const existing = await client.query(
        `SELECT product_id AS id
         FROM product_variants
         WHERE sku = $1`,
        ['LIP-NUDE-35']
      );

      prod2Id = existing.rows[0]?.id;
    }

    if (!prod2Id) throw new Error('Could not find Matte Lipstick product.');

    await client.query(
      `UPDATE products
       SET image_url = $1
       WHERE id = $2`,
      [
        'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=600&auto=format&fit=crop&q=60',
        prod2Id
      ]
    );


    // Variant 2A: Nude Pink

    await client.query(
      `INSERT INTO product_variants
       (product_id, sku, shade, size, price, stock_on_hand, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (sku) DO UPDATE
       SET image_url = EXCLUDED.image_url`,
      [
        prod2Id,
        'LIP-NUDE-35',
        'Nude Pink',
        '3.5g',
        250.00,
        19,
        'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=600&auto=format&fit=crop&q=60'
      ]
    );


    // Variant 2B: Ruby Red

    await client.query(
      `INSERT INTO product_variants
       (product_id, sku, shade, size, price, stock_on_hand, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (sku) DO UPDATE
       SET image_url = EXCLUDED.image_url`,
      [
        prod2Id,
        'LIP-RUBY-35',
        'Ruby Red',
        '3.5g',
        250.00,
        9,
        'https://images.unsplash.com/photo-1645961359170-c01fa306aa6b?w=600&auto=format&fit=crop&q=60'
      ]
    );


    await client.query('COMMIT');

    console.log('Catalog updated successfully!');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to update catalog:', err.message);

  } finally {
    client.release();
    await pool.end();
  }
}

seedCatalog();
