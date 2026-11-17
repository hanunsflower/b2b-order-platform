import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { api } from "../api.js";
import BuyerNav from "../components/BuyerNav.jsx";
import styles from "./Products.module.css";

export default function Products() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("");
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState("name");

  useEffect(() => {
    async function load() {
      const { ok, data } = await api("GET", "/api/products");
      if (ok) setItems(data);
      else setMessage(data?.error || "Could not load products");
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

  const brands = [...new Set(items.map((i) => i.brand).filter(Boolean))];

  const q = search.trim().toLowerCase();
  const visible = items
    .filter(
      (i) =>
        !q ||
        [i.name, i.shade, i.sku, i.brand].some((v) =>
          v?.toLowerCase().includes(q),
        ),
    )
    .filter((i) => !brand || i.brand === brand)
    .filter((i) => !inStock || i.available > 0)
    .sort((a, b) =>
      sort === "price_asc"
        ? Number(a.price) - Number(b.price)
        : sort === "price_desc"
          ? Number(b.price) - Number(a.price)
          : a.name.localeCompare(b.name),
    );

  function reset() {
    setSearch("");
    setBrand("");
    setInStock(false);
    setSort("name");
  }

  return (
    <div className={styles.page}>
      <BuyerNav />
      <h1>Our products</h1>
      {message && <p className={styles.notice}>{message}</p>}

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <h3>Filters</h3>

          <label className={styles.label}>Search</label>
          <div className={styles.searchBox}>
            <Search size={16} />
            <input
              placeholder="Name, shade or SKU"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <label className={styles.label}>Brand</label>
          <select value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <label className={styles.label}>Sort by</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="name">Name</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>

          <label className={styles.check}>
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
            />
            In stock only
          </label>

          <button className={styles.reset} onClick={reset}>
            Clear filters
          </button>
        </aside>

        <section>
          <p className={styles.count}>
            {visible.length} of {items.length} products
          </p>
          {visible.length === 0 && (
            <p className={styles.empty}>No products match.</p>
          )}
          <div className={styles.grid}>
            {visible.map((item) => (
              <div key={item.variant_id} className={styles.card}>
                <p className={styles.name}>{item.name}</p>
                <p className={styles.meta}>
                  {item.brand} · {item.shade} · {item.size}
                </p>
                <p className={styles.sku}>{item.sku}</p>
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
        </section>
      </div>
    </div>
  );
}
