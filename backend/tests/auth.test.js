import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { api, loginAdmin } from './helpers.js';

describe('Buyer registration and approval', () => {
  // A unique email each run, so tests never clash with old data
  const email = `test-${Date.now()}@example.com`;
  const password = 'password123';
  let adminToken;
  let buyerId;

  before(async () => {
    adminToken = await loginAdmin();
  });

  it('registers a new buyer as pending', async () => {
    const { status, data } = await api('POST', '/api/auth/register', {
      body: { email, password, businessName: 'Test Shop' },
    });
    assert.equal(status, 201);
    assert.equal(data.user.status, 'pending');
    buyerId = data.user.id;
  });

  it('rejects a duplicate email', async () => {
    const { status } = await api('POST', '/api/auth/register', {
      body: { email, password, businessName: 'Test Shop' },
    });
    assert.equal(status, 409);
  });

  it('blocks login before approval', async () => {
    const { status } = await api('POST', '/api/auth/login', {
      body: { email, password },
    });
    assert.equal(status, 403);
  });

  it('rejects a wrong password with 401', async () => {
    const { status } = await api('POST', '/api/auth/login', {
      body: { email, password: 'wrong-password' },
    });
    assert.equal(status, 401);
  });

  it('lets the admin approve the buyer', async () => {
    const { status } = await api('PATCH', `/api/admin/buyers/${buyerId}`, {
      token: adminToken,
      body: { status: 'approved' },
    });
    assert.equal(status, 200);
  });

  it('allows login after approval', async () => {
    const { status, data } = await api('POST', '/api/auth/login', {
      body: { email, password },
    });
    assert.equal(status, 200);
    assert.ok(data.token);
  });
});