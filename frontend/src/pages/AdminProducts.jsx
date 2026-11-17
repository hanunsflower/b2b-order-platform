import { useEffect, useState } from "react";
import { api } from "../api.js";
import AdminNav from "../components/AdminNav.jsx";
import styles from "./AdminProducts.module.css";

const emptyForm = {
  name: "",
  brand: "",
  sku: "",
  shade: "",
  size: "",
  price: "",
  stock: "",
};

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [edits, setEdits] = useState({}); // { [variantId]: { price: "", delta: "" } }
  const [form, setForm] = useState(emptyForm);
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

  function setField(field, value) {
    setForm({ ...form, [field]: value });
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

  async function createProduct(e) {
    e.preventDefault();
    setMessage("");

    const body = {
      name: form.name,
      brand: form.brand,
      variants: [
        {
          sku: form.sku,
          shade: form.shade,
          size: form.size,
          price: Number(form.price),
          stock: Number(form.stock),
        },
      ],
    };

    const { ok, data } = await api("POST", "/api/products", body);
    if (ok) {
      setMessage(`Created ${data.name}`);
      setForm(emptyForm);
      loadProducts();
    } else {
      setMessage(data?.error || "Could not create product");
    }
  }

  return (
    <div className={styles.page}>
      <AdminNav />
      <h1>Products and stock</h1>
      {message && <p className={styles.notice}>{message}</p>}

      <form className={styles.createForm} onSubmit={createProduct}>
        <h3>Create a product</h3>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          required
        />
        <input
          placeholder="Brand"
          value={form.brand}
          onChange={(e) => setField("brand", e.target.value)}
        />
        <input
          placeholder="SKU (e.g. FND-BEIGE-30)"
          value={form.sku}
          onChange={(e) => setField("sku", e.target.value)}
          required
        />
        <input
          placeholder="Shade"
          value={form.shade}
          onChange={(e) => setField("shade", e.target.value)}
        />
        <input
          placeholder="Size"
          value={form.size}
          onChange={(e) => setField("size", e.target.value)}
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setField("price", e.target.value)}
          required
        />
        <input
          type="number"
          min="0"
          step="1"
          placeholder="Stock"
          value={form.stock}
          onChange={(e) => setField("stock", e.target.value)}
          required
        />
        <button type="submit">Create</button>
      </form>

      {items.length === 0 && <p className={styles.empty}>No products yet.</p>}

      {items.map((it) => (
        <div key={it.variant_id} className={styles.card}>
          <p className={styles.name}>
            {it.name} ({it.shade}, {it.size}) — {it.sku}
          </p>
          <p className={styles.sub}>
            Price:{" "}
            <span className={styles.price}>
              {Number(it.price).toFixed(2)} ETB
            </span>{" "}
            · Available: {it.available}
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
