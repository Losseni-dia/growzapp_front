// src/components/LoginForm/LoginForm.tsx

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./LoginForm.module.css";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { UserDTO } from "../../types/user";
import { api } from "../../service/api";

// 1. IMPORT DE LA TRADUCTION
import { useTranslation } from "react-i18next";

export default function LoginForm() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  // 2. RECUPERATION DES OUTILS DE TRADUCTION
  const { t, i18n } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const response = await api.post<any>("/api/auth/login", {
        login: login.trim(),
        password,
      });

      const token = response.token;
      const user = response.user;

      if (!token || !user) {
        toast.error(t("login_page.toast_error_server"));
        return;
      }

      // === APPLICATION DE LA LANGUE SAUVEGARDÉE ===
      if (user.interfaceLanguage) {
        i18n.changeLanguage(user.interfaceLanguage);
      }
      // ============================================

      authLogin(token, user as UserDTO);
      toast.success(t("login_page.toast_success"));
      navigate("/");
    } catch (err: any) {
      // Si le backend envoie un message spécifique, on l'affiche, sinon message traduit par défaut
      toast.error(err.message || t("login_page.toast_error_credentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* TITRE TRADUIT */}
      <h2>{t("login_page.title")}</h2>

      <input
        type="text"
        placeholder={t("login_page.placeholder_login")}
        value={login}
        onChange={(e) => setLogin(e.target.value)}
        required
        autoFocus
      />

      <input
        type="password"
        placeholder={t("login_page.placeholder_password")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button type="submit" disabled={loading} className={styles.submitBtn}>
        {loading ? t("login_page.btn_loading") : t("login_page.btn_submit")}
      </button>

      {/* LIEN D'INSCRIPTION (Utilise maintenant la classe CSS .registerLink) */}
      <div className={styles.registerLink}>
        <span>{t("login_page.no_account")} </span>
        <Link to="/register">{t("login_page.register_link")}</Link>
      </div>
    </form>
  );
}
