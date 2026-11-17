import pool from '../../db/db.js';
import {
  createProductWithVariants,
  updateVariant,
  setProductImage,
  setVariantImage, // <--- ADDED
} from './products.service.js';

// An image link is optional, but if given it must be a real http(s) URL.
function validImageUrl(value) {
  if (value === undefined || value === null || value === '') return true;
  if (typeof value !== 'string' || value.length > 500) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function createProduct(req, res) {
  const { name, variants, imageUrl } = req.body;

  if (!name || !Array.isArray(variants) || variants.length === 0) {
    return res.status(400).json({ error: 'name and at least one variant are required' });
  }
  if (!validImageUrl(imageUrl)) {
    return res.status(400).json({ error: 'imageUrl must be a valid http or https link (max 500 characters)' });
  }
  for (const v of variants) {
    const priceOk = typeof v.price === 'number' && v.price >= 0;
    const stockOk = Number.isInteger(v.stock) && v.stock >= 0;
    if (!v.sku || !priceOk || !stockOk) {
      return res.status(400).json({
        error: 'each variant needs sku, numeric price >= 0 and integer stock >= 0',
      });
    }
  }

  try {
    const product = await createProductWithVariants(req.body, req.user.id);
    res.status(201).json(product);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'SKU already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function listProducts(req, res) {
  try {
    const result = await pool.query(
      `SELECT p.id AS product_id, p.name, p.brand, 
              COALESCE(v.image_url, p.image_url) AS image_url, -- <--- THE FIX
              v.id AS variant_id, v.sku, v.shade, v.size, v.price,
              (v.stock_on_hand - v.stock_reserved) AS available
       FROM products p
       JOIN product_variants v ON v.product_id = p.id
       WHERE p.is_active = true
       ORDER BY p.name, v.sku`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateVariantController(req, res) {
  const { variantId } = req.params;
  const { price, stockDelta } = req.body;

  if (!Number.isInteger(Number(variantId))) {
    return res.status(400).json({ error: 'variantId must be a number' });
  }
  if (price === undefined && stockDelta === undefined) {
    return res.status(400).json({ error: 'At least one of price or stockDelta must be provided' });
  }
  if (price !== undefined && (typeof price !== 'number' || price < 0)) {
    return res.status(400).json({ error: 'price must be a number >= 0' });
  }
  if (stockDelta !== undefined && !Number.isInteger(stockDelta)) {
    return res.status(400).json({ error: 'stockDelta must be an integer' });
  }

  try {
    const variant = await updateVariant(Number(variantId), { price, stockDelta }, req.user.id);
    res.json(variant);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateProductImageController(req, res) {
  const { productId } = req.params;
  const { imageUrl } = req.body;

  if (!Number.isInteger(Number(productId))) {
    return res.status(400).json({ error: 'productId must be a number' });
  }
  if (!validImageUrl(imageUrl)) {
    return res.status(400).json({ error: 'imageUrl must be a valid http or https link (max 500 characters)' });
  }

  try {
    const product = await setProductImage(Number(productId), imageUrl, req.user.id);
    res.json(product);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

// --- NEW CONTROLLER ADDED BELOW ---
export async function updateVariantImageController(req, res) {
  const { variantId } = req.params;
  const { imageUrl } = req.body;

  if (!Number.isInteger(Number(variantId))) {
    return res.status(400).json({ error: 'variantId must be a number' });
  }
  if (!validImageUrl(imageUrl)) {
    return res.status(400).json({ error: 'imageUrl must be a valid http or https link (max 500 characters)' });
  }

  try {
    const variant = await setVariantImage(Number(variantId), imageUrl, req.user.id);
    res.json(variant);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}