import { useEffect, useState } from "react";
import { api } from "../api.js";
import AdminNav from "../components/AdminNav.jsx";
import styles from "./AdminOrders.module.css";

function nextStatus(order) {
  if (order.status === "payment_verified") {
    return order.fulfillment_method === "pickup"
      ? "ready_for_pickup"
      : "out_for_delivery";
  }
  if (
    order.status === "ready_for_pickup" ||
    order.status === "out_for_delivery"
  ) {
    return "completed";
  }
  return null;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("payment_verified");
  const [message, setMessage] = useState("");

  async function loadOrders() {
    const path = filter
      ? `/api/admin/orders?status=${filter}`
      : "/api/admin/orders";
    const { ok, data } = await api("GET", path);
    if (ok) setOrders(data);
    else setMessage(data?.error || "Could not load orders");
  }

  useEffect(() => {
    loadOrders();
  }, [filter]);

  async function move(orderId, status) {
    const { ok, data } = await api(
      "PATCH",
      `/api/admin/orders/${orderId}/status`,
      { status },
    );
    setMessage(
      ok
        ? `Order #${orderId} is now ${status}`
        : data?.error || "Could not update",
    );
    loadOrders();
  }

  return (
    <div className={styles.page}>
      <AdminNav />
      <h1>Orders</h1>

      <select
        className={styles.filter}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      >
        <option value="">All</option>
        <option value="payment_submitted">Payment submitted</option>
        <option value="payment_verified">Payment verified</option>
        <option value="ready_for_pickup">Ready for pickup</option>
        <option value="out_for_delivery">Out for delivery</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>

      {message && <p className={styles.notice}>{message}</p>}
      {orders.length === 0 && (
        <p className={styles.empty}>No orders for this filter.</p>
      )}

      <div className={styles.grid}>
        {orders.map((o) => {
          const next = nextStatus(o);
          return (
            <div key={o.id} className={styles.card}>
              <div className={styles.head}>
                <p className={styles.id}>Order #{o.id}</p>
                <span className={`${styles.badge} ${styles[o.status] || ""}`}>
                  {o.status}
                </span>
              </div>
              <p className={styles.sub}>{o.business_name}</p>
              <p className={styles.sub}>
                {o.fulfillment_method}
                {o.delivery_address ? `: ${o.delivery_address}` : ""}
              </p>
              <p className={styles.total}>
                Total: {Number(o.total).toFixed(2)} ETB
              </p>
              {next && (
                <button onClick={() => move(o.id, next)}>Mark as {next}</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
