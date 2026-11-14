import pool from '../../db/db.js';
import { createProductWithVariants } from './products.service.js';

export async function createProduct(req, res) {
  const { name, brand, description, variants } = req.body;

  // 1. Validate: name required, variants is a non-empty array,
  //    each variant has sku, price >= 0, integer stock >= 0 (400 if not)
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!Array.isArray(variants) || variants.length === 0) {
    return res.status(400).json({ error: 'Variants is a required non-empty array' });
  }
  for (const variant of variants) {
    if (!variant.sku || variant.price < 0 || !Number.isInteger(variant.stock)) {
      return res.status(400).json({ error: 'Each variant must have a valid SKU, price, and stock' });
    }
  }

  try {
    // 2. Call createProductWithVariants(req.body, req.user.id)
    const product = await createProductWithVariants(req.body, req.user.id);
    // 3. Send 201 with the product
    res.status(201).json(product);
  } catch (err) {
    // 4. If err.code === '23505' -> 409 'SKU already exists'
    if (err.code === '23505') {
      return res.status(409).json({ error: 'SKU already exists' });
    }
    // 5. Otherwise log it and send 500
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function listProducts(req, res) {
  // Query products JOIN product_variants WHERE is_active = true
  // Return: product name, brand, sku, shade, size, price,
  //         (stock_on_hand - stock_reserved) AS available
  // Send back the rows
    try {
    const result = await pool.query(
      `SELECT p.name, p.brand,
       v.id AS variant_id, v.sku, v.shade, v.size, v.price,
       (v.stock_on_hand - v.stock_reserved) AS available
       FROM products p
       JOIN product_variants v ON p.id = v.product_id
       WHERE p.is_active = true`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}