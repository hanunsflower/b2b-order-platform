import { Link, useNavigate } from "react-router-dom";
import { logout } from "../auth.js";

export default function AdminNav() {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
      <Link to="/admin/buyers">Buyers</Link>
      <Link to="/admin/payments">Payments</Link>
      <Link to="/admin/orders">Orders</Link>
      <Link to="/admin/products">Products</Link>
      <button onClick={handleLogout}>Log out</button>
    </div>
  );
}
