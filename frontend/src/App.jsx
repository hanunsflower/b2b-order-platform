import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Products from "./pages/Products.jsx";
import AdminBuyers from "./pages/AdminBuyers.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Home />} />
      <Route
        path="/products"
        element={
          <ProtectedRoute role="buyer">
            <Products />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/buyers"
        element={
          <ProtectedRoute role="admin">
            <AdminBuyers />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
