import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

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
      businessName
    });
    if (!ok) {
      setError(data?.error || "Registration failed");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div style={{ maxWidth: 400, margin: "0 auto", padding: 16 }}>
        <h1>Registered</h1>
        <p>Registered. Please wait for Admin approval.</p>
        <Link to="/login">Back to login</Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: 400, margin: "0 auto", padding: 16 }}
    >
      <h1>Register</h1>
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
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button type="submit">Register</button>
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </form>
  );
}
