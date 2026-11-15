export const BASE = process.env.API_URL || 'http://localhost:3000';

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
    body: { email: 'admin@example.com', password: 'Admin12345' },
  });
  return data.token;
}

export async function loginBuyer(email = 'shop1@example.com', password = 'password123') {
  const { data } = await api('POST', '/api/auth/login', { body: { email, password } });
  return data.token;
}