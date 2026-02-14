import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { api } from "../../service/Api"; // Ton instance Axios
import "./ResetPassword.css";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  // États du formulaire
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  // Redirection si pas de token
  useEffect(() => {
    if (!token) {
      setStatus({
        type: "error",
        message: "Token de réinitialisation manquant.",
      });
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    // Validations Front
    if (password.length < 8) {
      return setStatus({
        type: "error",
        message: "Le mot de passe doit contenir au moins 8 caractères.",
      });
    }
    if (password !== confirmPassword) {
      return setStatus({
        type: "error",
        message: "Les mots de passe ne correspondent pas.",
      });
    }

    setLoading(true);
    try {
      // Appel vers ton @PostMapping("/reset-password") dans AuthController
      const response = await api.post("/api/auth/reset-password", {
        token: token,
        password: password,
      });

      setStatus({
        type: "success",
        message: "Votre mot de passe a été réinitialisé avec succès !",
      });

      // Redirection après 3 secondes
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      const errorMsg =
        err.response?.data ||
        "Une erreur est survenue. Le lien est peut-être expiré.";
      setStatus({ type: "error", message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-card">
        <div className="reset-header">
          <div className="logo-placeholder">G</div>
          <h1>Nouveau mot de passe</h1>
          <p>Définissez votre nouveau secret pour accéder à Growzapp.</p>
        </div>

        <form onSubmit={handleSubmit} className="reset-form">
          <div className="input-group">
            <label>Nouveau mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading || !token}
            />
          </div>

          <div className="input-group">
            <label>Confirmez le mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading || !token}
            />
          </div>

          {status.message && (
            <div className={`alert ${status.type}`}>{status.message}</div>
          )}

          <button
            type="submit"
            className="btn-submit"
            disabled={loading || !token}
          >
            {loading
              ? "Traitement en cours..."
              : "Mettre à jour le mot de passe"}
          </button>
        </form>

        <div className="reset-footer">
          <Link to="/login">Retour à la connexion</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
