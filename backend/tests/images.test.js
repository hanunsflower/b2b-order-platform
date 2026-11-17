import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { api, loginAdmin, createApprovedBuyer, pool } from './helpers.js';

describe('Product images', () => {
  let adminToken;
  let buyerToken;
  const sku = `IMG-${Date.now()}`;
  const imageUrl = 'https://example.com/lipstick.jpg';

  before(async () => {
    adminToken = await loginAdmin();
    buyerToken = await createApprovedBuyer(adminToken, 'imagebuyer');
  });

  after(async () => {
    await pool.end();
  });

  it('creates a product with an image link and returns it in the list', async () => {
    const create = await api('POST', '/api/products', {
      token: adminToken,
      body: {
        name: 'Image Test',
        imageUrl,
        variants: [{ sku, shade: 'Red', size: '5g', price: 100, stock: 3 }],
      },
    });
    assert.equal(create.status, 201);
    assert.equal(create.data.image_url, imageUrl);

    const list = await api('GET', '/api/products', { token: buyerToken });
    const row = list.data.find((v) => v.sku === sku);
    assert.equal(row.image_url, imageUrl);
  });

  it('rejects an image link that is not http or https (400)', async () => {
    const { status } = await api('POST', '/api/products', {
      token: adminToken,
      body: {
        name: 'Bad Image',
        imageUrl: 'javascript:alert(1)',
        variants: [{ sku: `BAD-${Date.now()}`, shade: 'X', size: '1', price: 1, stock: 1 }],
      },
    });
    assert.equal(status, 400);
  });

  it('lets an admin change the image, and blocks a buyer (403)', async () => {
    const list = await api('GET', '/api/products', { token: adminToken });
    const productId = list.data.find((v) => v.sku === sku).product_id;

    const ok = await api('PATCH', `/api/products/${productId}/image`, {
      token: adminToken,
      body: { imageUrl: 'https://example.com/new.png' },
    });
    assert.equal(ok.status, 200);
    assert.equal(ok.data.image_url, 'https://example.com/new.png');

    const blocked = await api('PATCH', `/api/products/${productId}/image`, {
      token: buyerToken,
      body: { imageUrl: 'https://example.com/hack.png' },
    });
    assert.equal(blocked.status, 403);
  });
});