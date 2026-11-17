import { useEffect, useState } from "react";
import { api } from "../api.js";
import AdminNav from "../components/AdminNav.jsx";
import styles from "./AdminBuyers.module.css";

export default function AdminBuyers() {
  const [buyers, setBuyers] = useState([]);
  const [message, setMessage] = useState("");

  async function loadBuyers() {
    const response = await api("GET", "/api/admin/buyers?status=pending");
    if (response.ok) setBuyers(response.data);
    else setMessage(response.data?.error || "Could not load buyers");
  }

  useEffect(() => {
    loadBuyers();
  }, []);

  async function review(id, status) {
    const response = await api("PATCH", `/api/admin/buyers/${id}`, { status });
    setMessage(
      response.ok
        ? `Buyer ${status}`
        : response.data?.error || "Could not update",
    );
    loadBuyers();
  }

  return (
    <div className={styles.page}>
      <AdminNav />
      <h1>Pending buyers</h1>
      {message && <p className={styles.notice}>{message}</p>}
      {buyers.length === 0 && (
        <p className={styles.empty}>No buyers waiting for approval.</p>
      )}

      <div className={styles.grid}>
        {buyers.map((b) => (
          <div key={b.id} className={styles.card}>
            <p className={styles.title}>{b.business_name}</p>
            <p className={styles.sub}>{b.email}</p>
            <button
              className={styles.approve}
              onClick={() => review(b.id, "approved")}
            >
              Approve
            </button>
            <button
              className={styles.reject}
              onClick={() => review(b.id, "rejected")}
            >
              Reject
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
