import { Navigate } from "react-router-dom";
import { getUser } from "../auth.js";

export default function ProtectedRoute({ role, children }) {
  const user = getUser();
  if (!user) return <Navigate to="/login" />; // not logged in
  if (role && user.role !== role) return <Navigate to="/" />; // wrong role
  return children;
}
