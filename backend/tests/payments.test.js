import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { api, loginAdmin, createApprovedBuyer, createVariant, stockOf, pool } from './helpers.js';

let adminToken;
const ref = () => `REF-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

// Add to cart and check out. Returns the order id.
async function placeOrder(buyer, variantId, quantity) {
  await api('POST', '/api/cart/items', { token: buyer, body: { variantId, quantity } });
  const { data } = await api('POST', '/api/orders', {
    token: buyer,
    body: { fulfillmentMethod: 'pickup' },
  });
  return data.id;
}

async function paymentIdFor(orderId) {
  const { data } = await api('GET', '/api/admin/payments?status=submitted', { token: adminToken });
  return data.find((p) => p.order_id === orderId)?.id;
}

describe('Payments, verification and cancel', () => {
  before(async () => {
    adminToken = await loginAdmin();
  });
  after(() => pool.end());

  it('reserves stock at checkout', async () => {
    const buyer = await createApprovedBuyer(adminToken, 'reserve');
    const variantId = await createVariant(adminToken, 10);
    await placeOrder(buyer, variantId, 2);
    assert.deepEqual(await stockOf(variantId), { on_hand: 10, reserved: 2 });
  });

  it('verification deducts on_hand and releases the reservation', async () => {
    const buyer = await createApprovedBuyer(adminToken, 'verify');
    const variantId = await createVariant(adminToken, 10);
    const orderId = await placeOrder(buyer, variantId, 2);

    const pay = await api('POST', `/api/orders/${orderId}/payment`, {
      token: buyer,
      body: { referenceNumber: ref() },
    });
    assert.equal(pay.status, 201);

    const paymentId = await paymentIdFor(orderId);
    const review = await api('PATCH', `/api/admin/payments/${paymentId}`, {
      token: adminToken,
      body: { status: 'verified' },
    });
    assert.equal(review.status, 200);
    assert.deepEqual(await stockOf(variantId), { on_hand: 8, reserved: 0 });

    // Reviewing the same payment again is refused
    const again = await api('PATCH', `/api/admin/payments/${paymentId}`, {
      token: adminToken,
      body: { status: 'verified' },
    });
    assert.equal(again.status, 409);
  });

  it('rejection keeps the reservation and the buyer can resubmit', async () => {
    const buyer = await createApprovedBuyer(adminToken, 'reject');
    const variantId = await createVariant(adminToken, 10);
    const orderId = await placeOrder(buyer, variantId, 2);

    await api('POST', `/api/orders/${orderId}/payment`, { token: buyer, body: { referenceNumber: ref() } });
    const firstPayment = await paymentIdFor(orderId);
    await api('PATCH', `/api/admin/payments/${firstPayment}`, {
      token: adminToken,
      body: { status: 'rejected' },
    });
    assert.deepEqual(await stockOf(variantId), { on_hand: 10, reserved: 2 });

    // Resubmit with a corrected reference, then verify
    const resubmit = await api('POST', `/api/orders/${orderId}/payment`, {
      token: buyer,
      body: { referenceNumber: ref() },
    });
    assert.equal(resubmit.status, 201);
    const secondPayment = await paymentIdFor(orderId);
    await api('PATCH', `/api/admin/payments/${secondPayment}`, {
      token: adminToken,
      body: { status: 'verified' },
    });
    assert.deepEqual(await stockOf(variantId), { on_hand: 8, reserved: 0 });
  });

  it('refuses a payment reference that was already used (409)', async () => {
    const buyerA = await createApprovedBuyer(adminToken, 'dupA');
    const buyerB = await createApprovedBuyer(adminToken, 'dupB');
    const variantId = await createVariant(adminToken, 10);
    const orderA = await placeOrder(buyerA, variantId, 1);
    const orderB = await placeOrder(buyerB, variantId, 1);

    const shared = ref();
    const first = await api('POST', `/api/orders/${orderA}/payment`, {
      token: buyerA,
      body: { referenceNumber: shared },
    });
    const second = await api('POST', `/api/orders/${orderB}/payment`, {
      token: buyerB,
      body: { referenceNumber: shared },
    });
    assert.equal(first.status, 201);
    assert.equal(second.status, 409);
  });

  it('cancel releases the reservation, and a second cancel is refused (409)', async () => {
    const buyer = await createApprovedBuyer(adminToken, 'cancel');
    const variantId = await createVariant(adminToken, 10);
    const orderId = await placeOrder(buyer, variantId, 3);
    assert.deepEqual(await stockOf(variantId), { on_hand: 10, reserved: 3 });

    const cancel = await api('POST', `/api/orders/${orderId}/cancel`, { token: buyer });
    assert.equal(cancel.status, 200);
    assert.deepEqual(await stockOf(variantId), { on_hand: 10, reserved: 0 });

    const again = await api('POST', `/api/orders/${orderId}/cancel`, { token: buyer });
    assert.equal(again.status, 409);
  });

  it("another buyer cannot pay for or cancel someone else's order (404)", async () => {
    const owner = await createApprovedBuyer(adminToken, 'owner');
    const stranger = await createApprovedBuyer(adminToken, 'stranger');
    const variantId = await createVariant(adminToken, 10);
    const orderId = await placeOrder(owner, variantId, 1);

    const pay = await api('POST', `/api/orders/${orderId}/payment`, {
      token: stranger,
      body: { referenceNumber: ref() },
    });
    const cancel = await api('POST', `/api/orders/${orderId}/cancel`, { token: stranger });
    assert.equal(pay.status, 404);
    assert.equal(cancel.status, 404);
    assert.deepEqual(await stockOf(variantId), { on_hand: 10, reserved: 1 });
  });

  it('cannot cancel while a payment is waiting for review (409)', async () => {
    const buyer = await createApprovedBuyer(adminToken, 'waiting');
    const variantId = await createVariant(adminToken, 10);
    const orderId = await placeOrder(buyer, variantId, 1);
    await api('POST', `/api/orders/${orderId}/payment`, { token: buyer, body: { referenceNumber: ref() } });

    const cancel = await api('POST', `/api/orders/${orderId}/cancel`, { token: buyer });
    assert.equal(cancel.status, 409);
  });
});