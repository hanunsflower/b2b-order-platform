import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import AuthLayout from "../components/AuthLayout.jsx";
import styles from "./Register.module.css";

export default function Register() {
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const { ok, data } = await api("POST", "/api/auth/register", {
      email,
      password,
      businessName,
    });
    if (!ok) {
      setError(data?.error || "Registration failed");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <AuthLayout>
        <div className={styles.form}>
          <h1 className={styles.title}>Registered</h1>
          <p className={styles.sub}>
            Registered. Please wait for Admin approval.
          </p>
          <p className={styles.footer}>
            <Link to="/login">Back to login</Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <form className={styles.form} onSubmit={handleSubmit}>
        <Link to="/" className={styles.back}>
          ← Back to home
        </Link>
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.sub}>
          Register your business. We approve new buyers quickly.
        </p>
        <input
          placeholder="Business name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit">Register</button>
        <p className={styles.footer}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
