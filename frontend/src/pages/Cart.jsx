import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import BuyerNav from "../components/BuyerNav.jsx";
import styles from "./Cart.module.css";

export default function Cart() {
  const [items, setItems] = useState([]);
  const [method, setMethod] = useState("pickup");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  async function loadCart() {
    const { ok, data } = await api("GET", "/api/cart");
    if (ok) {
      setItems(data);
    } else {
      setMessage(data?.error || "Could not load cart");
    }
  }

  useEffect(() => {
    loadCart();
  }, []);

  async function removeItem(variantId) {
    await api("DELETE", `/api/cart/items/${variantId}`);
    loadCart();
  }

  async function checkout() {
    setMessage("");
    const body = { fulfillmentMethod: method };
    if (method === "delivery") {
      body.deliveryAddress = address;
    }
    const { ok, data } = await api("POST", "/api/orders", body);
    if (ok) {
      navigate("/orders");
    } else {
      setMessage(data?.error || "Checkout failed");
    }
  }

  // the total is calculated from the items (Decision 5), not stored
  const total = items.reduce((sum, i) => sum + Number(i.line_total), 0);

  return (
    <div className={styles.page}>
      <BuyerNav />
      <h1>Your cart</h1>
      {message && <p className={styles.notice}>{message}</p>}
      {items.length === 0 && (
        <p className={styles.empty}>Your cart is empty.</p>
      )}

      {items.map((i) => (
        <div key={i.variant_id} className={styles.card}>
          <div>
            <p className={styles.name}>{i.name}</p>
            <p className={styles.sub}>
              {i.shade} · {i.size} · Available: {i.available}
            </p>
          </div>
          <div>
            <p className={styles.line}>
              {Number(i.price).toFixed(2)} ETB × {i.quantity} ={" "}
              {Number(i.line_total).toFixed(2)} ETB
            </p>
            <button
              className={styles.remove}
              onClick={() => removeItem(i.variant_id)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      {items.length > 0 && (
        <div className={styles.summary}>
          <h3 className={styles.total}>Total: {total.toFixed(2)} ETB</h3>

          <div className={styles.options}>
            <label className={styles.option}>
              <input
                type="radio"
                checked={method === "pickup"}
                onChange={() => setMethod("pickup")}
              />
              Pickup
            </label>
            <label className={styles.option}>
              <input
                type="radio"
                checked={method === "delivery"}
                onChange={() => setMethod("delivery")}
              />
              Delivery
            </label>
          </div>

          {method === "delivery" && (
            <input
              className={styles.address}
              placeholder="Delivery address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          )}

          <button onClick={checkout}>Place order</button>
        </div>
      )}
    </div>
  );
}
