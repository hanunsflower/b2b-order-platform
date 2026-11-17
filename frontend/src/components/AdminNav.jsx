import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../auth.js";
import styles from "./AdminNav.module.css";

const cls = ({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`;

export default function AdminNav() {
  const navigate = useNavigate();
  function handleLogout() {
    logout();
    navigate("/login");
  }
  return (
    <nav className={styles.nav}>
      <span className={styles.brand}>✨ Admin</span>
      <NavLink to="/admin/buyers" className={cls}>
        Buyers
      </NavLink>
      <NavLink to="/admin/payments" className={cls}>
        Payments
      </NavLink>
      <NavLink to="/admin/orders" className={cls}>
        Orders
      </NavLink>
      <NavLink to="/admin/products" className={cls}>
        Products
      </NavLink>
      <button className={styles.logout} onClick={handleLogout}>
        Log out
      </button>
    </nav>
  );
}
