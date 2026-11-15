import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<h1>Home (coming soon)</h1>} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
