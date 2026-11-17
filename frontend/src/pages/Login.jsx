import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";
import AuthLayout from "../components/AuthLayout.jsx";
import styles from "./Login.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

    async function handleLogin(loginEmail, loginPassword) {
      setError("");
      setLoading(true);

      const { ok, data } = await api("POST", "/api/auth/login", {
        email: loginEmail,
        password: loginPassword,
      });

      if (!ok) {
        setError(data?.error || "Something went wrong");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);

      let userRole = null;

      // Decode the token
      if (data.token) {
        try {
          const payloadBase64 = data.token.split(".")[1];
          const decodedPayload = JSON.parse(window.atob(payloadBase64));

          // --- DEBUG LOG ---
          console.log("What is inside the decoded token?", decodedPayload);

          userRole = decodedPayload.role;
        } catch (err) {
          console.error("Could not decode token", err);
        }
      }

      // Fallback: check if backend sends role directly
      if (!userRole && data.role) {
        userRole = data.role;
      }

      console.log("Final Role Detected:", userRole);

      if (userRole) {
        localStorage.setItem("role", userRole);
      }

      if (userRole === "admin") {
        navigate("/admin/buyers");
      } else {
        navigate("/");
      }

      setLoading(false);
    }

  async function handleSubmit(e) {
    e.preventDefault();
    await handleLogin(email, password);
  }

  async function handleDemo(type) {
    const demoEmail = type === "admin" ? "admin@demo.com" : "buyer@demo.com";
    const demoPassword = "demo1234"; // Remember the 8 characters!
    await handleLogin(demoEmail, demoPassword);
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

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>

        <p className={styles.footer}>
          New business? <Link to="/register">Create account</Link>
        </p>

        {/* --- DEMO BUTTONS --- */}
        <div className={styles.demoSection}>
          <p className={styles.demoText}>Just exploring? Try the demo:</p>
          <div className={styles.demoBtns}>
            <button
              type="button"
              onClick={() => handleDemo("buyer")}
              className={styles.demoBuyer}
              disabled={loading}
            >
              🛍️ Demo Buyer
            </button>
            <button
              type="button"
              onClick={() => handleDemo("admin")}
              className={styles.demoAdmin}
              disabled={loading}
            >
              👑 Demo Admin
            </button>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
