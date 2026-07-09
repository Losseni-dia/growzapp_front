import { useState } from "react";
import axios from "axios";

interface VoveIdSession {
  refId: string;
  widgetUrl: string;
  publicKey: string;
}

const KycVoveId = () => {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<VoveIdSession | null>(null);
  const [mode, setMode] = useState<"choix" | "auto" | "manuel">("choix");
  const [error, setError] = useState<string | null>(null);

  const startVoveId = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/kyc/start-voveid",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setSession(response.data);

      // Ouvrir le widget VOVE ID dans une nouvelle fenêtre
      window.open(response.data.widgetUrl, "_blank", "width=600,height=700");
    } catch (err) {
      setError("Erreur lors du démarrage de la vérification. Réessayez.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kyc-container">
      <h2>Vérification d'identité (KYC)</h2>
      <p className="kyc-subtitle">
        Conformément aux exigences de la BCEAO et de l'UEMOA, nous devons
        vérifier votre identité avant tout investissement.
      </p>

      {mode === "choix" && (
        <div className="kyc-mode-selector">
          <div
            className="kyc-mode-card recommended"
            onClick={() => setMode("auto")}
          >
            <span className="badge">Recommandé</span>
            <h3>⚡ Vérification automatique</h3>
            <ul>
              <li>✅ Résultat en moins de 2 minutes</li>
              <li>✅ Compatible CNI biométrique ivoirienne (ONECI)</li>
              <li>✅ Conforme BCEAO — Instruction n°003-03-2025</li>
              <li>✅ Screening AML automatique</li>
            </ul>
            <button className="btn-primary">Choisir cette option</button>
          </div>

          <div className="kyc-mode-card" onClick={() => setMode("manuel")}>
            <h3>📄 Envoi manuel des documents</h3>
            <ul>
              <li>⏳ Validation sous 24-48h par notre équipe</li>
              <li>📎 Upload recto/verso CNI + selfie</li>
            </ul>
            <button className="btn-secondary">Choisir cette option</button>
          </div>
        </div>
      )}

      {mode === "auto" && (
        <div className="kyc-auto">
          <button className="btn-back" onClick={() => setMode("choix")}>
            ← Retour
          </button>

          <h3>Vérification automatique via VOVE ID</h3>

          {error && <p className="error-message">{error}</p>}

          {!session && (
            <button
              onClick={startVoveId}
              disabled={loading}
              className="btn-voveid"
            >
              {loading ? "Chargement..." : "Démarrer la vérification"}
            </button>
          )}

          {session && (
            <div className="kyc-session-info">
              <p className="success-message">
                ✅ Une fenêtre de vérification s'est ouverte.
              </p>
              <p>
                Suivez les instructions pour scanner votre document d'identité
                et prendre un selfie.
              </p>
              <p className="info-message">
                Cette page se mettra à jour automatiquement après validation.
              </p>
              <button
                onClick={startVoveId}
                disabled={loading}
                className="btn-secondary"
              >
                Rouvrir la fenêtre de vérification
              </button>
            </div>
          )}
        </div>
      )}

      {mode === "manuel" && (
        <div className="kyc-manuel">
          <button className="btn-back" onClick={() => setMode("choix")}>
            ← Retour
          </button>
          <h3>Envoi manuel des documents</h3>
          {/* 
            Ici tu gardes ton formulaire manuel existant 
            Upload recto, verso, selfie 
          */}
          <p>Formulaire manuel existant à intégrer ici.</p>
        </div>
      )}
    </div>
  );
};

export default KycVoveId;
