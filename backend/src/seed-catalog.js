import pool from './db/db.js';

async function seedCatalog() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // --- PRODUCT 1: Almost Lipstick ---
    const prod1 = await client.query(
      `INSERT INTO products (name, brand, description, image_url)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Almost Lipstick', 'Clinique', 'A sheer, glossy lip color.', 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&q=80']
    );
    const prod1Id = prod1.rows[0].id;

    await client.query(
      `INSERT INTO product_variants (product_id, sku, shade, size, price, stock_on_hand, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (sku) DO NOTHING`,
      [prod1Id, 'LIP-NUDE-19', 'Nude Honey', '1.9g', 1000.00, 50, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80']
    );


    // --- PRODUCT 2: Matte Lipstick ---
    const prod2 = await client.query(
      `INSERT INTO products (name, brand, description, image_url)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Matte Lipstick', 'Glow', 'Long-lasting matte finish.', null]
    );
    const prod2Id = prod2.rows[0].id;

    // Variant 2A: Nude Pink
    await client.query(
      `INSERT INTO product_variants (product_id, sku, shade, size, price, stock_on_hand, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (sku) DO NOTHING`,
      [prod2Id, 'LIP-NUDE-35', 'Nude Pink', '3.5g', 250.00, 19, 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&q=80']
    );

    // Variant 2B: Ruby Red
    await client.query(
      `INSERT INTO product_variants (product_id, sku, shade, size, price, stock_on_hand, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (sku) DO NOTHING`,
      [prod2Id, 'LIP-RUBY-35', 'Ruby Red', '3.5g', 250.00, 9, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&q=80']
    );

    await client.query('COMMIT');
    console.log('Catalog seeded successfully!');
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to seed catalog:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seedCatalog();