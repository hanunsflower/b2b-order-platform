import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  api,
  loginAdmin,
  createApprovedBuyer,
  createVariant,
  stockOf,
  pool,
} from './helpers.js';

describe('Admin variant updates', () => {
  let adminToken;

  before(async () => {
    adminToken = await loginAdmin();
  });

  after(async () => {
    await pool.end();
  });

  it('stockDelta raises on_hand', async () => {
    const variantId = await createVariant(adminToken, 10);

    const response = await api('PATCH', `/api/products/variants/${variantId}`, {
      token: adminToken,
      body: { stockDelta: 5 },
    });
    assert.equal(response.status, 200);

    assert.deepEqual(await stockOf(variantId), { on_hand: 15, reserved: 0 });
  });

  it('cannot reduce stock below the reserved amount (409)', async () => {
    const variantId = await createVariant(adminToken, 10);
    const buyerToken = await createApprovedBuyer(adminToken, 'variantbuyer');

    // Add 4 to the cart
    const cart = await api('POST', '/api/cart/items', {
      token: buyerToken,
      body: { variantId, quantity: 4 },
    });
    assert.equal(cart.status, 201);

    // Check out: this reserves 4
    const order = await api('POST', '/api/orders', {
      token: buyerToken,
      body: { fulfillmentMethod: 'pickup' },
    });
    assert.equal(order.status, 201);
    assert.deepEqual(await stockOf(variantId), { on_hand: 10, reserved: 4 });

    // -8 would leave 2 on hand while 4 are reserved
    const update = await api('PATCH', `/api/products/variants/${variantId}`, {
      token: adminToken,
      body: { stockDelta: -8 },
    });
    assert.equal(update.status, 409);

    // Nothing changed
    assert.deepEqual(await stockOf(variantId), { on_hand: 10, reserved: 4 });
  });
});