import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../auth.js";
import styles from "./BuyerNav.module.css";

const cls = ({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`;

export default function BuyerNav() {
  const navigate = useNavigate();
  function handleLogout() {
    logout();
    navigate("/login");
  }
  return (
    <nav className={styles.nav}>
      <span className={styles.brand}>Glow Wholesale</span>
      <NavLink to="/products" className={cls}>
        Products
      </NavLink>
      <NavLink to="/cart" className={cls}>
        Cart
      </NavLink>
      <NavLink to="/orders" className={cls}>
        My orders
      </NavLink>
      <button className={styles.logout} onClick={handleLogout}>
        Log out
      </button>
    </nav>
  );
}
