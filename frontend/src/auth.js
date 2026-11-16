export function getUser() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp * 1000 < Date.now()) {   // token expired
      localStorage.removeItem('token');
      return null;
    }
    return payload;                          // { id, role, iat, exp }
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem('token');
}