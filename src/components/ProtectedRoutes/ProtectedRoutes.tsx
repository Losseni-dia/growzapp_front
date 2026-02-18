// src/components/ProtectedRoutes/ProtectedRoutes.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

interface ProtectedRouteProps {
  allowedRoles?: string[]; // Optionnel
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
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

  // 1. Si pas d'utilisateur, redirection Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Si des rôles sont spécifiés, on vérifie l'autorisation
  if (allowedRoles) {
    const hasAccess =
      user.roles?.some((role: string) => allowedRoles.includes(role)) ?? false;

    if (!hasAccess) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 3. Sinon (connecté et autorisé), on affiche la page
  return <Outlet />;
}
