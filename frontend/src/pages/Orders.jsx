import { useEffect, useState } from "react";
import { api } from "../api.js";
import BuyerNav from "../components/BuyerNav.jsx";
import styles from "./Orders.module.css";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [refs, setRefs] = useState({}); // payment reference typed per order id
  const [invoice, setInvoice] = useState(null);
  const [message, setMessage] = useState("");

  async function loadOrders() {
    const { ok, data } = await api("GET", "/api/orders");
    if (ok) {
      setOrders(data);
    } else {
      setMessage(data?.error || "Could not load orders");
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function submitPayment(orderId) {
    const { ok, data } = await api("POST", `/api/orders/${orderId}/payment`, {
      referenceNumber: refs[orderId],
    });
    setMessage(ok ? "Payment submitted" : data?.error || "Could not submit");
    if (ok) setRefs({ ...refs, [orderId]: "" });
    loadOrders();
  }

  async function cancelOrder(orderId) {
    const { ok, data } = await api("POST", `/api/orders/${orderId}/cancel`);
    setMessage(ok ? "Order cancelled" : data?.error || "Could not cancel");
    loadOrders();
  }

  async function viewInvoice(orderId) {
    setMessage("");
    const { ok, data } = await api("GET", `/api/orders/${orderId}/invoice`);
    if (ok) {
      setInvoice(data);
    } else {
      setMessage(data?.error || "Invoice not available");
    }
  }

  const canPay = (s) => s === "pending_payment" || s === "payment_rejected";
  const hasInvoice = (s) =>
    [
      "payment_verified",
      "ready_for_pickup",
      "out_for_delivery",
      "completed",
    ].includes(s);

  return (
    <div className={styles.page}>
      <BuyerNav />
      <h1>My orders</h1>
      {message && <p className={styles.notice}>{message}</p>}

      {invoice && (
        <div className={styles.invoice}>
          <h3>Invoice {invoice.invoice_number}</h3>
          {invoice.items.map((it) => (
            <p key={it.sku}>
              {it.name} ({it.shade}) x {it.quantity} @{" "}
              {Number(it.unit_price).toFixed(2)} ={" "}
              {Number(it.line_total).toFixed(2)} ETB
            </p>
          ))}
          <strong>Total: {invoice.total} ETB</strong>
          <div>
            <button onClick={() => setInvoice(null)}>Close</button>
          </div>
        </div>
      )}

      {orders.length === 0 && <p>No orders yet.</p>}

      {orders.map((o) => (
        <div key={o.id} className={styles.card}>
          <div className={styles.head}>
            <p className={styles.id}>Order #{o.id}</p>
            <span className={`${styles.badge} ${styles[o.status] || ""}`}>
              {o.status}
            </span>
          </div>
          <p className={styles.sub}>
            {o.fulfillment_method}
            {o.delivery_address ? `: ${o.delivery_address}` : ""}
          </p>
          <p className={styles.total}>
            Total: {Number(o.total).toFixed(2)} ETB
          </p>

          {canPay(o.status) && (
            <div className={styles.payRow}>
              <input
                placeholder="Payment reference (e.g. CBE123456)"
                value={refs[o.id] || ""}
                onChange={(e) => setRefs({ ...refs, [o.id]: e.target.value })}
              />
              <button onClick={() => submitPayment(o.id)}>
                Submit payment
              </button>
              <button
                className={styles.cancel}
                onClick={() => cancelOrder(o.id)}
              >
                Cancel order
              </button>
            </div>
          )}
          {hasInvoice(o.status) && (
            <button onClick={() => viewInvoice(o.id)}>View invoice</button>
          )}
        </div>
      ))}
    </div>
  );
}
