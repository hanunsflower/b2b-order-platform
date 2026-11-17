import { useEffect, useState } from "react";
import { api } from "../api.js";
import AdminNav from "../components/AdminNav.jsx";
import styles from "./AdminPayments.module.css";

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [message, setMessage] = useState("");

  async function loadPayments() {
    const response = await api("GET", "/api/admin/payments?status=submitted");
    if (response.ok) setPayments(response.data);
    else setMessage(response.data?.error || "Could not load payments");
  }

  useEffect(() => {
    loadPayments();
  }, []);

  async function review(paymentId, status) {
    const response = await api("PATCH", `/api/admin/payments/${paymentId}`, {
      status,
    });
    setMessage(
      response.ok
        ? `Payment ${status}`
        : response.data?.error || "Could not update",
    );
    loadPayments();
  }

  return (
    <div className={styles.page}>
      <AdminNav />
      <h1>Payments to review</h1>
      {message && <p className={styles.notice}>{message}</p>}
      {payments.length === 0 && (
        <p className={styles.empty}>No payments waiting for review.</p>
      )}

      <div className={styles.grid}>
        {payments.map((p) => (
          <div key={p.id} className={styles.card}>
            <p className={styles.title}>Order #{p.order_id}</p>
            <p className={styles.sub}>
              Reference: <code>{p.reference_number}</code>
            </p>
            <p className={styles.sub}>
              Submitted: {new Date(p.submitted_at).toLocaleString()}
            </p>
            <button
              className={styles.approve}
              onClick={() => review(p.id, "verified")}
            >
              Verify
            </button>
            <button
              className={styles.reject}
              onClick={() => review(p.id, "rejected")}
            >
              Reject
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
