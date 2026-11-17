import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";
import AuthLayout from "../components/AuthLayout.jsx";
import styles from "./Login.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const { ok, data } = await api("POST", "/api/auth/login", {
      email,
      password,
    });
    if (!ok) {
      setError(data?.error || "Something went wrong");
      return;
    }
    localStorage.setItem("token", data.token);
    navigate("/");
  }

  return (
    <AuthLayout>
      <form className={styles.form} onSubmit={handleSubmit}>
        <Link to="/" className={styles.back}>
          ← Back to home
        </Link>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.sub}>Sign in to your wholesale account.</p>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit">Log in</button>
        <p className={styles.footer}>
          New business? <Link to="/register">Create account</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
