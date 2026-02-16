import { CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../service/Api";
import styles from "./ResetPassword.module.css";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token)
      setStatus({ type: "error", message: "Lien invalide (token manquant)." });
  }, [token]);

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
    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { token, password });
      setStatus({
        type: "success",
        message: "Mot de passe mis à jour avec succès !",
      });
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err.message || "Erreur ou lien expiré.",
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
          <h1>Nouveau mot de passe</h1>
        </div>

        <form onSubmit={handleSubmit}>
          {/* CHAMP 1 : NOUVEAU MOT DE PASSE */}
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

            {/* Barre de force liée au mot de passe principal */}
            {password.length > 0 && (
              <div className={styles["strength-meter"]}>
                <div
                  className={`${styles["strength-bar"]} ${styles[`level-${strength}`]}`}
                  style={{ width: `${(strength / 4) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* CHAMP 2 : CONFIRMATION */}
          <div className={styles["input-group"]}>
            <label>Confirmation du mot de passe</label>
            <div className={styles["password-wrapper"]}>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              {/* Optionnel: On peut aussi mettre l'oeil ici si tu veux */}
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
            disabled={loading || !token || password !== confirmPassword}
          >
            {loading ? <span className={styles["loader"]}></span> : "Valider"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
