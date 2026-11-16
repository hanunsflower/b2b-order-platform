import { Navigate } from 'react-router-dom';
import { getUser } from '../auth.js';

export default function Home() {
  const user = getUser();

  // 1. If there is no user, return <Navigate to="/login" />
  if (!user) {
    return <Navigate to="/login" />;
  }

  // 2. If user.role is 'admin', return <Navigate to="/admin/buyers" />
  if (user.role === 'admin') {
    return <Navigate to="/admin/buyers" />;
  }

  // 3. Otherwise return <Navigate to="/products" />
  return <Navigate to="/products" />;
}
