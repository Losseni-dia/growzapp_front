// src/components/ProtectedRoutes/ProtectedRoutes.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

interface ProtectedRouteProps {
  allowedRoles?: string[]; // Optionnel
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

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

  // 1bis. Mot de passe temporaire (réinitialisation assistée par l'admin) :
  // on bloque toute navigation tant qu'il n'a pas été changé.
  if (user.mustChangePassword && location.pathname !== "/changer-mot-de-passe") {
    return <Navigate to="/changer-mot-de-passe" replace />;
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
