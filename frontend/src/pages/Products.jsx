import { useEffect, useState } from "react";
import { api } from "../api.js";
import BuyerNav from "../components/BuyerNav.jsx";
import styles from "./Products.module.css";

export default function Products() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const { ok, data } = await api("GET", "/api/products");
      if (ok) {
        setItems(data);
      } else {
        setMessage(data?.error || "Could not load products");
      }
    }
    load();
  }, []);

  async function addToCart(variantId) {
    const { ok, data } = await api("POST", "/api/cart/items", {
      variantId,
      quantity: 1,
    });
    setMessage(ok ? "Added to cart" : data?.error || "Could not add");
  }

  return (
    <div className={styles.page}>
      <BuyerNav />
      <h1>Our products</h1>
      {message && <p className={styles.notice}>{message}</p>}
      {items.length === 0 && <p>No products yet.</p>}
      <div className={styles.grid}>
        {items.map((item) => (
          <div key={item.variant_id} className={styles.card}>
            <p className={styles.name}>{item.name}</p>
            <p className={styles.meta}>
              {item.shade} · {item.size}
            </p>
            <p className={styles.price}>
              {Number(item.price).toFixed(2)} <small>ETB</small>
            </p>
            <span
              className={`${styles.stock} ${item.available === 0 ? styles.out : item.available < 5 ? styles.low : ""}`}
            >
              {item.available === 0
                ? "Out of stock"
                : `${item.available} available`}
            </span>
            <button
              onClick={() => addToCart(item.variant_id)}
              disabled={item.available === 0}
            >
              Add to cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
