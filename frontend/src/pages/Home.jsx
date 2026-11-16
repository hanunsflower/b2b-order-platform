import { Navigate } from 'react-router-dom';
import { getUser } from '../auth.js';

export default function Home() {
  const user = getUser();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin/buyers" />;
  }
  
  return <Navigate to="/products" />;
}
