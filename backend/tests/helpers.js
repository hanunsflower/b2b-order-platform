import pool from '../src/db/db.js';
export { pool };

// Use port 3001 for tests. We ensure the env var is set, otherwise fallback to the test port.
export const BASE = process.env.API_URL || 'http://localhost:3001';

// One small function for every request, so tests stay short
export async function api(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

export async function loginAdmin() {
  const { data } = await api('POST', '/api/auth/login', {
    body: { email: 'admin@demo.com', password: 'demo1234' },
  });
  if (!data || !data.token) {
    throw new Error(`Admin login failed. Make sure the test API is running on ${BASE} and admin@demo.com is seeded.`);
  }
  return data.token;
}

export async function loginBuyer(email = 'buyer@demo.com', password = 'demo1234') {
  const { data } = await api('POST', '/api/auth/login', { body: { email, password } });
  if (!data || !data.token) {
    throw new Error(`Buyer login failed for ${email}`);
  }
  return data.token;
}

export async function createApprovedBuyer(adminToken, label) {
  const email = `${label}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
  
  const reg = await api('POST', '/api/auth/register', {
    body: { email, password: 'password123', businessName: label },
  });
  
  if (reg.status !== 201) {
    throw new Error(`Register failed: ${reg.status} ${JSON.stringify(reg.data)}`);
  }

  await api('PATCH', `/api/admin/buyers/${reg.data.user.id}`, {
    token: adminToken,
    body: { status: 'approved' },
  });
  
  return loginBuyer(email, 'password123');
}

// Creates a product with one variant and returns the variant id
export async function createVariant(adminToken, stock) {
  const sku = `T-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  
  const res = await api('POST', '/api/products', {
    token: adminToken,
    body: { name: 'Test Item', variants: [{ sku, shade: 'X', size: '1', price: 100, stock }] },
  });
  
  if (res.status !== 201) {
    throw new Error(`Product create failed: ${res.status} ${JSON.stringify(res.data)}`);
  }

  const { rows } = await pool.query('SELECT id FROM product_variants WHERE sku = $1', [sku]);
  if (!rows[0]) {
    throw new Error(`Variant with SKU ${sku} not found in DB`);
  }
  return rows[0].id;
}

export async function stockOf(variantId) {
  const { rows } = await pool.query(
    'SELECT stock_on_hand AS on_hand, stock_reserved AS reserved FROM product_variants WHERE id = $1',
    [variantId]
  );
  return rows[0];
}