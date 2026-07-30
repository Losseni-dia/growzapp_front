import { useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../service/Api";
import { useAuth } from "../Context/AuthContext";

export default function OAuth2RedirectHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const processLogin = async () => {
      const token = searchParams.get("token");

      if (token) {
        try {
          // Le cookie HttpOnly est déjà posé par le backend à ce stade — on
          // n'a plus besoin de manipuler le token manuellement (HIGH-03).
          console.log("Appel /api/auth/me en cours...");
          const response: any = await api.get("/api/auth/me");

          // Si ton backend renvoie ApiResponseDTO<UserDTO>, les données sont dans response.data
          const userData = response.data || response;

          login(token, userData);

          navigate("/");
        } catch (err: any) {
          console.error("Erreur durant le process OAuth2:", err);
          toast.error("Impossible de récupérer votre profil.");
          navigate("/login");
        }
      } else {
        navigate("/login?error=oauth2");
      }
    };

    processLogin();
  }, [searchParams, login, navigate]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
      }}
    >
      <div className="loader"></div> {/* Ajoute ton loader CSS ici */}
      <p
        style={{
          color: "var(--growz-primary)",
          marginTop: "1rem",
          fontWeight: "bold",
        }}
      >
        Finalisation de la connexion sécurisée...
      </p>
    </div>
  );
}
