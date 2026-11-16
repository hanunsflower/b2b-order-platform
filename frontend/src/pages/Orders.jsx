import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

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
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 16 }}>
      <Link to="/products">Back to products</Link>
      <h1>My orders</h1>
      {message && <p>{message}</p>}

      {invoice && (
        <div style={{ border: "2px solid #333", padding: 8, marginBottom: 16 }}>
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
        <div
          key={o.id}
          style={{ border: "1px solid #ccc", padding: 8, marginBottom: 8 }}
        >
          <p>
            <strong>Order #{o.id}</strong> - {o.status}
          </p>
          <p>
            {o.fulfillment_method}
            {o.delivery_address ? `: ${o.delivery_address}` : ""}
          </p>
          <p>Total: {Number(o.total).toFixed(2)} ETB</p>

          {canPay(o.status) && (
            <div>
              <input
                placeholder="Payment reference (e.g. CBE123456)"
                value={refs[o.id] || ""}
                onChange={(e) => setRefs({ ...refs, [o.id]: e.target.value })}
              />
              <button onClick={() => submitPayment(o.id)}>
                Submit payment
              </button>
              <button onClick={() => cancelOrder(o.id)}>Cancel order</button>
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
