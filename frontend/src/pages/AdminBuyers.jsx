import { useEffect, useState } from "react";
import { api } from "../api.js";
import AdminNav from "../components/AdminNav.jsx";

export default function AdminBuyers() {
  const [buyers, setBuyers] = useState([]);
  const [message, setMessage] = useState("");

  async function loadBuyers() {
    const response = await api("GET", "/api/admin/buyers?status=pending");
    if (response.ok) {
      setBuyers(response.data);
    } else {
      setMessage(response.data?.error || 'Could not load buyers');
    }
  }

  useEffect(() => {
    loadBuyers();
  }, []);

  async function review(id, status) {

    const response = await api("PATCH", `/api/admin/buyers/${id}`, { status });
    if (response.ok) {
      setMessage(`Buyer ${status}`);
    } else {
      setMessage(response.data?.error || 'Could not update');
    }
    loadBuyers();
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 16 }}>
      <AdminNav />
      <h1>Pending buyers</h1>
      {message && <p>{message}</p>}
      {buyers.length === 0 && <p>No buyers waiting for approval.</p>}

      {buyers.map((b) => (
        <div
          key={b.id}
          style={{ border: "1px solid #ccc", padding: 8, marginBottom: 8 }}
        >
          <p>
            <strong>{b.business_name}</strong> ({b.email})
          </p>
          <button onClick={() => review(b.id, "approved")}>Approve</button>
          <button onClick={() => review(b.id, "rejected")}>Reject</button>
        </div>
      ))}
    </div>
  );
}
