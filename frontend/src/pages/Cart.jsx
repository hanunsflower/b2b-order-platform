import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";

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
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 16 }}>
      <Link to="/products">Back to products</Link>
      <h1>Your cart</h1>
      {message && <p style={{ color: "red" }}>{message}</p>}
      {items.length === 0 && <p>Your cart is empty.</p>}

      {items.map((i) => (
        <div
          key={i.variant_id}
          style={{ border: "1px solid #ccc", padding: 8, marginBottom: 8 }}
        >
          <p>
            <strong>{i.name}</strong> ({i.shade}, {i.size})
          </p>
          <p>
            {Number(i.price).toFixed(2)} ETB x {i.quantity} ={" "}
            {Number(i.line_total).toFixed(2)} ETB
          </p>
          <p>Available: {i.available}</p>
          <button onClick={() => removeItem(i.variant_id)}>Remove</button>
        </div>
      ))}

      {items.length > 0 && (
        <div>
          <h3>Total: {total.toFixed(2)} ETB</h3>

          <label>
            <input
              type="radio"
              checked={method === "pickup"}
              onChange={() => setMethod("pickup")}
            />
            Pickup
          </label>
          <label style={{ marginLeft: 12 }}>
            <input
              type="radio"
              checked={method === "delivery"}
              onChange={() => setMethod("delivery")}
            />
            Delivery
          </label>

          {method === "delivery" && (
            <div>
              <input
                placeholder="Delivery address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          )}

          <button onClick={checkout} style={{ marginTop: 8 }}>
            Place order
          </button>
        </div>
      )}
    </div>
  );
}
