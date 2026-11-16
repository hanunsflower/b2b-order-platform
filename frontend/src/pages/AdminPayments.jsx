import { useEffect, useState } from "react";
import { api } from "../api.js";
import AdminNav from "../components/AdminNav.jsx";

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [message, setMessage] = useState("");

  async function loadPayments() {
    const response = await api("GET", "/api/admin/payments?status=submitted");
    if (response.ok) {
      setPayments(response.data);
    } else {
      setMessage(response.data?.error || 'Could not load payments');
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  async function review(paymentId, status) {
    const response = await api("PATCH", `/api/admin/payments/${paymentId}`, { status });
    if (response.ok) {
      setMessage(`Payment ${status}`);
    } else {
      setMessage(response.data?.error || 'Could not update');
    }
    loadPayments();
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 16 }}>
      <AdminNav />
      <h1>Payments to review</h1>
      {message && <p>{message}</p>}
      {payments.length === 0 && <p>No payments waiting for review.</p>}

      {payments.map((p) => (
        <div
          key={p.id}
          style={{ border: "1px solid #ccc", padding: 8, marginBottom: 8 }}
        >
          <p>
            <strong>Order #{p.order_id}</strong> - reference{" "}
            <code>{p.reference_number}</code>
          </p>
          <p>Submitted: {new Date(p.submitted_at).toLocaleString()}</p>
          <button onClick={() => review(p.id, "verified")}>Verify</button>
          <button onClick={() => review(p.id, "rejected")}>Reject</button>
        </div>
      ))}
    </div>
  );
}
