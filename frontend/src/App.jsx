import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Products from "./pages/Products.jsx";
import AdminBuyers from "./pages/AdminBuyers.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Cart from "./pages/Cart.jsx";
import Orders from "./pages/Orders.jsx";
import AdminPayments from "./pages/AdminPayments.jsx";
import AdminOrders from "./pages/AdminOrders.jsx";
import Register from "./pages/Register.jsx";
import AdminProducts from "./pages/AdminProducts.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/products"
        element={
          <ProtectedRoute role="buyer">
            <Products />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cart"
        element={
          <ProtectedRoute role="buyer">
            <Cart />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute role="buyer">
            <Orders />
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
      <Route
        path="/admin/payments"
        element={
          <ProtectedRoute role="admin">
            <AdminPayments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute role="admin">
            <AdminOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute role="admin">
            <AdminProducts />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
