// src/components/LoginForm/LoginForm.tsx

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./LoginForm.module.css";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { UserDTO } from "../../types/user";
import { api } from "../../service/api";

export default function LoginForm() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const response = await api.post<any>("/auth/login", {
        login: login.trim(),
        password,
      });

      const token = response.token;
      const user = response.user;

      if (!token || !user) {
        toast.error("Réponse invalide du serveur");
        return;
      }

      authLogin(token, user as UserDTO);
      toast.success("Connecté avec succès !");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>Connexion à growzapp</h2>

      <input
        type="text"
        placeholder="Login ou email"
        value={login}
        onChange={(e) => setLogin(e.target.value)}
        required
        autoFocus
      />

      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button type="submit" disabled={loading} className={styles.submitBtn}>
        {loading ? "Connexion..." : "Se connecter"}
      </button>

      {/* LIEN SIMPLE, VISIBLE, IMPOSSIBLE À MANQUER */}
      <div style={{ textAlign: "center", marginTop: "28px" }}>
        <span style={{ color: "#1B5E20", fontSize: "15px" }}>
          Pas encore de compte ?{" "}
        </span>
        <Link
          to="/register"
          style={{
            color: "#27ae60",
            fontWeight: "bold",
            fontSize: "17px",
            textDecoration: "underline",
          }}
        >
          S’inscrire gratuitement
        </Link>
      </div>
    </form>
  );
}
