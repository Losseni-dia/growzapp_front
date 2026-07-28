import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./LoginForm.module.css";
import { useAuth } from "../Context/AuthContext";
import toast from "react-hot-toast";
import { UserDTO } from "../../types/user";
import { api } from "../../service/Api";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function LoginForm() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleSocialLogin = (provider: "google") => {
    // Redirection vers le backend Spring Security
    window.location.href = `${API_BASE_URL}/oauth2/authorization/${provider}`;
  };

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

      // 1. On lance la connexion
      authLogin(token, user as UserDTO);

      // 2. Pas de toast ici comme demandé.
      // 3. On utilise un micro-délai pour éviter que le Router
      //    ne change de page avant que le Context ne soit prêt.
      setTimeout(() => {
        navigate("/");
      }, 50);
    } catch (err: any) {
      toast.error(err.message || t("login_page.toast_error_credentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>{t("login_page.title")}</h2>
      <p className={styles.subtitle}>{t("login_page.subtitle")}</p>

      <input
        type="text"
        placeholder={t("login_page.placeholder_login")}
        value={login}
        onChange={(e) => setLogin(e.target.value)}
        required
      />

      <div className={styles.passwordContainer}>
        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder={t("login_page.placeholder_password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className={styles.eyeBtn}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <div className={styles.forgotPasswordWrapper}>
          <Link to="/forgot-password" className={styles.forgotPasswordLink}>
            {t("login_page.forgot_password")}
          </Link>
        </div>
      </div>

      <button type="submit" disabled={loading} className={styles.submitBtn}>
        {loading ? t("login_page.btn_loading") : t("login_page.btn_submit")}
      </button>

      <div className={styles.socialDivider}>
        {t("login_page.or_continue_with")}
      </div>
      
      <div className={styles.socialButtons}>
        <button
          type="button"
          className={styles.socialBtn}
          onClick={() => handleSocialLogin("google")}
        >
          <img src="/google.png" alt="Google" className={styles.socialIcon} />
        </button>
      </div>

      <div className={styles.registerLink}>
        <span>{t("login_page.no_account")} </span>
        <Link to="/register">{t("login_page.register_link")}</Link>
      </div>
    </form>
  );
}
