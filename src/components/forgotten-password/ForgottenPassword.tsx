import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../service/Api";
import "./ResetPassword.css"; // On réutilise le même CSS pour la cohérence

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      // Appel vers ton @PostMapping("/forgot-password")
      await api.post("/api/auth/forgot-password", { email });

      // Message générique pour la sécurité (ne pas confirmer si l'email existe ou non)
      setStatus({
        type: "success",
        message:
          "Si un compte est associé à cet email, un lien de réinitialisation vous a été envoyé.",
      });
      setEmail(""); // On vide le champ
    } catch (err: any) {
      setStatus({
        type: "error",
        message: "Une erreur est survenue. Veuillez réessayer plus tard.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-card">
        <div className="reset-header">
          <div className="logo-placeholder">G</div>
          <h1>Mot de passe oublié ?</h1>
          <p>
            Entrez votre adresse email pour recevoir un lien de récupération.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="reset-form">
          <div className="input-group">
            <label>Votre adresse email</label>
            <input
              type="email"
              placeholder="exemple@growzapp.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {status.message && (
            <div className={`alert ${status.type}`}>{status.message}</div>
          )}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Envoi en cours..." : "Envoyer le lien"}
          </button>
        </form>

        <div className="reset-footer">
          <span>Vous vous en souvenez ? </span>
          <Link to="/login">Connexion</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
