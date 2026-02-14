// src/components/LoginForm/LoginForm.tsx

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./LoginForm.module.css";
import { useAuth } from "../Context/AuthContext";
import toast from "react-hot-toast";
import { UserDTO } from "../../types/user";
import { api } from "../../service/Api";
import { useTranslation } from "react-i18next";

export default function LoginForm() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
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

      if (user.interfaceLanguage) {
        i18n.changeLanguage(user.interfaceLanguage);
      }

      authLogin(token, user as UserDTO);
      toast.success(t("login_page.toast_success"));
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || t("login_page.toast_error_credentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>{t("login_page.title")}</h2>

      <input
        type="text"
        placeholder={t("login_page.placeholder_login")}
        value={login}
        onChange={(e) => setLogin(e.target.value)}
        required
        autoFocus
      />

      <div className={styles.passwordContainer}>
        <input
          type="password"
          placeholder={t("login_page.placeholder_password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {/* AJOUT DU LIEN MOT DE PASSE OUBLIÉ */}
        <div className={styles.forgotPasswordWrapper}>
          <Link to="/forgot-password" className={styles.forgotPasswordLink}>
            {t("login_page.forgot_password")}
          </Link>
        </div>
      </div>

      <button type="submit" disabled={loading} className={styles.submitBtn}>
        {loading ? t("login_page.btn_loading") : t("login_page.btn_submit")}
      </button>

      <div className={styles.registerLink}>
        <span>{t("login_page.no_account")} </span>
        <Link to="/register">{t("login_page.register_link")}</Link>
      </div>
    </form>
  );
}
