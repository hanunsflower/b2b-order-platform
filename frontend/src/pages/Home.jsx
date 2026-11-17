import { Navigate } from "react-router-dom";
import { getUser } from "../auth.js";
import Landing from "./Landing.jsx";

export default function Home() {
  const user = getUser();

  if (!user) {
    return <Landing />;
  }
  if (user.role === "admin") {
    return <Navigate to="/admin/buyers" />;
  }
  return <Navigate to="/products" />;
}
