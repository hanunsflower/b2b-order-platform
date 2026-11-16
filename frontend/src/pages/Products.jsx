import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { logout } from "../auth.js";

export default function Products() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

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

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 16 }}>
      <button onClick={handleLogout}>Log out</button>

      <Link to="/cart" style={{ marginLeft: 8 }}>
        View cart
      </Link>
      <h1>Products</h1>
      {message && <p>{message}</p>}

      {items.length === 0 && <p>No products yet.</p>}

      {items.map((item) => (
        <div
          key={item.variant_id}
          style={{ border: "1px solid #ccc", padding: 8, marginBottom: 8 }}
        >
          <p>
            <strong>Name:</strong> {item.name}
          </p>
          <p>
            <strong>Shade:</strong> {item.shade}
          </p>
          <p>
            <strong>Size:</strong> {item.size}
          </p>
          <p>
            <strong>Price:</strong> {Number(item.price).toFixed(2)} ETB
          </p>
          <p>
            <strong>Available:</strong> {item.available}
          </p>
          <button
            onClick={() => addToCart(item.variant_id)}
            disabled={item.available === 0}
          >
            Add to cart
          </button>
        </div>
      ))}
    </div>
  );
}
