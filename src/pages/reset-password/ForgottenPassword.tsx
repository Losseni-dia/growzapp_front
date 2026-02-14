// src/pages/Auth/ForgotPassword.tsx
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
    // On type la réponse pour plus de clarté
    const response: any = await api.post("/api/auth/forgot-password", {
      email: email.trim().toLowerCase(),
    });

    // On utilise les propriétés de ApiResponseDTO
    if (response.success) {
      setStatus({
        type: "success",
        message:
          response.message || "Un lien a été envoyé si le compte existe.",
      });
      setEmail("");
    } else {
      // Cas où le serveur répond avec success: false
      setStatus({
        type: "error",
        message: response.message || "Impossible d'envoyer le lien.",
      });
    }
  } catch (err: any) {
    // Erreur réseau ou exception jetée par Api.ts
    setStatus({
      type: "error",
      message: err.message || "Une erreur est survenue lors de l'envoi.",
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
