import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { api, loginAdmin, loginBuyer } from './helpers.js';

describe('Role-based access', () => {
  let adminToken;
  let buyerToken;

  before(async () => {
    adminToken = await loginAdmin();
    buyerToken = await loginBuyer();
  });

  it('rejects a request with no token (401)', async () => {
    const { status } = await api('GET', '/api/admin/buyers');
    assert.equal(status, 401);
  });

  it('blocks a buyer from admin routes (403)', async () => {
    const { status } = await api('GET', '/api/admin/buyers', { token: buyerToken });
    assert.equal(status, 403);
  });

  it('blocks an admin from the cart (403)', async () => {
    const { status } = await api('GET', '/api/cart', { token: adminToken });
    assert.equal(status, 403);
  });

  it('accepts a valid buyer token on a buyer route (200)', async () => {
    const { status } = await api('GET', '/api/cart', { token: buyerToken });
    assert.equal(status, 200);
  });
});