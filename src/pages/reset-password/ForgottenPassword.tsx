import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../service/Api";
import styles from "./ResetPassword.module.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const response: any = await api.post("/api/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      if (response.success) {
        setStatus({ type: "success", message: response.message });
        setEmail("");
      } else {
        setStatus({ type: "error", message: response.message });
      }
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err.message || "Une erreur est survenue.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles["reset-password-page"]}>
      <div className={styles["reset-card"]}>
        <div className={styles["reset-header"]}>
          <div className={styles["logo-placeholder"]}>G</div>
          <h1>Récupération</h1>
          <p>Entrez votre email Growzapp</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles["input-group"]}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
            />
          </div>
          {status.message && (
            <div className={`${styles.alert} ${styles[status.type]}`}>
              {status.message}
            </div>
          )}
          <button
            type="submit"
            className={styles["btn-submit"]}
            disabled={loading}
          >
            {loading ? "Envoi..." : "Envoyer le lien"}
          </button>
        </form>
        <div className={styles["reset-footer"]}>
          <Link to="/login">Retour à la connexion</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
