import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { api } from "../../service/Api";
import { UserDTO } from "../../types/user";
import toast from "react-hot-toast";

export default function OAuth2RedirectHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const processLogin = async () => {
      const token = searchParams.get("token");

      if (token) {
        try {
          // 1. On stocke temporairement le token pour que l'appel /me fonctionne
          localStorage.setItem("access_token", token);

          // 2. On récupère les infos de l'utilisateur depuis le serveur
          const user = await api.get<UserDTO>("/api/auth/me");

          // 3. On utilise ta fonction de login du contexte pour tout synchroniser
          login(token, user);

          toast.success("Connexion réussie !");
          navigate("/");
        } catch (err) {
          console.error("Erreur sync user OAuth2", err);
          localStorage.removeItem("access_token");
          toast.error("Erreur lors de la récupération du profil");
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
      <p style={{ color: "#1B5E20", marginTop: "1rem", fontWeight: "bold" }}>
        Finalisation de la connexion sécurisée...
      </p>
    </div>
  );
}
