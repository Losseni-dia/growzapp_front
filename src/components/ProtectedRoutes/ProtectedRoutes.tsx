// src/components/ProtectedRoutes/ProtectedRoutes.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{ padding: "100px", textAlign: "center", fontSize: "1.5rem" }}
      >
        Chargement de votre session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
