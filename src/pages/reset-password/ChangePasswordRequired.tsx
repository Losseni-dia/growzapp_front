import { CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../service/Api";
import { useAuth } from "../../components/Context/AuthContext";
import styles from "./ResetPassword.module.css";

const ChangePasswordRequired = () => {
  const { user, updateUserInfo, logout } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const getStrength = () => {
    if (password.length === 0) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setStatus({
        type: "error",
        message: "Les mots de passe diffèrent.",
      });
    }
    if (password.length < 8) {
      return setStatus({
        type: "error",
        message: "Le nouveau mot de passe doit contenir au moins 8 caractères.",
      });
    }
    setLoading(true);
    try {
      await api.post("/api/auth/change-password", {
        currentPassword,
        newPassword: password,
      });
      setStatus({
        type: "success",
        message: "Mot de passe mis à jour avec succès !",
      });
      if (user) {
        updateUserInfo({ ...user, mustChangePassword: false });
      }
      setTimeout(() => navigate("/"), 1500);
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err.message || "Erreur : mot de passe actuel incorrect ?",
      });
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrength();

  return (
    <div className={styles["reset-password-page"]}>
      <div className={styles["reset-card"]}>
        <div className={styles["reset-header"]}>
          <div className={styles["logo-placeholder"]}>
            <Lock size={24} />
          </div>
          <h1>Changement de mot de passe requis</h1>
        </div>

        <p style={{ fontSize: "0.9rem", color: "#555", marginBottom: "1rem" }}>
          Votre mot de passe a été réinitialisé par un administrateur. Pour
          continuer, définissez un nouveau mot de passe personnel.
        </p>

        <form onSubmit={handleSubmit}>
          <div className={styles["input-group"]}>
            <label>Mot de passe temporaire actuel</label>
            <div className={styles["password-wrapper"]}>
              <input
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className={styles["input-group"]}>
            <label>Nouveau mot de passe</label>
            <div className={styles["password-wrapper"]}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className={styles["eye-btn"]}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {password.length > 0 && (
              <div className={styles["strength-meter"]}>
                <div
                  className={`${styles["strength-bar"]} ${styles[`level-${strength}`]}`}
                  style={{ width: `${(strength / 4) * 100}%` }}
                />
              </div>
            )}
          </div>

          <div className={styles["input-group"]}>
            <label>Confirmation du nouveau mot de passe</label>
            <div className={styles["password-wrapper"]}>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {status.message && (
            <div className={`${styles.alert} ${styles[status.type]}`}>
              {status.type === "success" && (
                <CheckCircle2 size={16} style={{ marginRight: "8px" }} />
              )}
              {status.message}
            </div>
          )}

          <button
            type="submit"
            className={styles["btn-submit"]}
            disabled={loading || !currentPassword || password !== confirmPassword}
          >
            {loading ? <span className={styles["loader"]}></span> : "Valider"}
          </button>
        </form>

        <button
          type="button"
          onClick={logout}
          style={{
            marginTop: "1rem",
            background: "none",
            border: "none",
            color: "#888",
            fontSize: "0.85rem",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
};

export default ChangePasswordRequired;
