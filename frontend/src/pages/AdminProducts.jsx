import { useEffect, useState } from "react";
import { api } from "../api.js";
import AdminNav from "../components/AdminNav.jsx";

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [edits, setEdits] = useState({}); // { [variantId]: { price: "", delta: "" } }
  const [message, setMessage] = useState("");

  async function loadProducts() {
    const { ok, data } = await api("GET", "/api/products");
    if (ok) {
      setItems(data);
    } else {
      setMessage(data?.error || "Could not load products");
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function setEdit(variantId, field, value) {
    setEdits({
      ...edits,
      [variantId]: { ...edits[variantId], [field]: value },
    });
  }

  async function update(variantId) {
    const e = edits[variantId] || {};
    const body = {};
    if (e.price !== undefined && e.price !== "") body.price = Number(e.price);
    if (e.delta !== undefined && e.delta !== "")
      body.stockDelta = Number(e.delta);

    if (Object.keys(body).length === 0) {
      setMessage("Enter a price or a stock change");
      return;
    }

    const { ok, data } = await api(
      "PATCH",
      `/api/products/variants/${variantId}`,
      body,
    );
    if (ok) {
      setMessage(
        `Updated ${data.sku}: price ${data.price}, on hand ${data.stock_on_hand}, reserved ${data.stock_reserved}`,
      );
      setEdits({ ...edits, [variantId]: {} });
      loadProducts();
    } else {
      setMessage(data?.error || "Could not update");
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 16 }}>
      <AdminNav />
      <h1>Products and stock</h1>
      {message && <p>{message}</p>}
      {items.length === 0 && <p>No products yet.</p>}

      {items.map((it) => (
        <div
          key={it.variant_id}
          style={{ border: "1px solid #ccc", padding: 8, marginBottom: 8 }}
        >
          <p>
            <strong>{it.name}</strong> ({it.shade}, {it.size}) - {it.sku}
          </p>
          <p>
            Price: {Number(it.price).toFixed(2)} ETB - Available: {it.available}
          </p>
          <input
            placeholder="New price"
            value={edits[it.variant_id]?.price || ""}
            onChange={(e) => setEdit(it.variant_id, "price", e.target.value)}
          />
          <input
            placeholder="Stock change (e.g. 15 or -2)"
            value={edits[it.variant_id]?.delta || ""}
            onChange={(e) => setEdit(it.variant_id, "delta", e.target.value)}
          />
          <button onClick={() => update(it.variant_id)}>Update</button>
        </div>
      ))}
    </div>
  );
}
