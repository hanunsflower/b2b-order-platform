import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { api, loginAdmin, loginBuyer } from './helpers.js';

// Create a fresh approved buyer so tests never share carts
async function createApprovedBuyer(adminToken, label) {
  const email = `${label}-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
  const reg = await api('POST', '/api/auth/register', {
    body: { email, password: 'password123', businessName: label },
  });
  await api('PATCH', `/api/admin/buyers/${reg.data.user.id}`, {
    token: adminToken,
    body: { status: 'approved' },
  });
  return loginBuyer(email, 'password123');
}

describe('Stock reservation', () => {
  let adminToken;
  let variantId;
  const sku = `TEST-${Date.now()}`;

  before(async () => {
    adminToken = await loginAdmin();
    // A product with exactly 1 unit in stock
    await api('POST', '/api/products', {
      token: adminToken,
      body: {
        name: 'Test Gloss',
        variants: [{ sku, shade: 'Clear', size: '5ml', price: 100, stock: 1 }],
      },
    });
    const { data } = await api('GET', '/api/products', { token: adminToken });
    variantId = data.find((v) => v.sku === sku).variant_id;
  });

  it('blocks ordering more than the available stock (409)', async () => {
    const buyer = await createApprovedBuyer(adminToken, 'oversell');
    await api('POST', '/api/cart/items', { token: buyer, body: { variantId, quantity: 5 } });
    const { status } = await api('POST', '/api/orders', {
      token: buyer,
      body: { fulfillmentMethod: 'pickup' },
    });
    assert.equal(status, 409);
  });

  it('lets only one of two simultaneous buyers get the last unit', async () => {
    const [a, b] = await Promise.all([
      createApprovedBuyer(adminToken, 'raceA'),
      createApprovedBuyer(adminToken, 'raceB'),
    ]);
    await api('POST', '/api/cart/items', { token: a, body: { variantId, quantity: 1 } });
    await api('POST', '/api/cart/items', { token: b, body: { variantId, quantity: 1 } });

    // Both check out at the same moment
    const results = await Promise.all([
      api('POST', '/api/orders', { token: a, body: { fulfillmentMethod: 'pickup' } }),
      api('POST', '/api/orders', { token: b, body: { fulfillmentMethod: 'pickup' } }),
    ]);
    const statuses = results.map((r) => r.status).sort();
    assert.deepEqual(statuses, [201, 409]);
  });
});