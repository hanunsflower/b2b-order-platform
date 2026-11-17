import { Link } from "react-router-dom";
import { Sparkles, Boxes, ReceiptText, ShieldCheck } from "lucide-react";
import styles from "./AuthLayout.module.css";

export default function AuthLayout({ children }) {
  return (
    <div className={styles.wrap}>
      <aside className={styles.panel}>
        <Link to="/" className={styles.brand}>
          Glow Wholesale
        </Link>
        <div>
          <h2 className={styles.headline}>Wholesale cosmetics, made simple.</h2>
          <ul className={styles.points}>
            <li>
              <Boxes size={20} /> Live stock on every shade and size
            </li>
            <li>
              <ReceiptText size={20} /> Locked prices and clear invoices
            </li>
            <li>
              <ShieldCheck size={20} /> Approved business buyers only
            </li>
          </ul>
        </div>
        <p className={styles.foot}>
          <Sparkles size={16} /> Demo project for the Arrowstack internship
        </p>
      </aside>
      <main className={styles.formSide}>{children}</main>
    </div>
  );
}
