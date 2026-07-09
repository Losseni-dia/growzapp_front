// KycSuccess.tsx
import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const KycSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get("status");

  useEffect(() => {
    // Rediriger vers le profil après 3 secondes
    const timer = setTimeout(() => {
      navigate("/profil");
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="kyc-success-container">
      {status === "success" && (
        <div className="success">
          <h2>✅ Vérification réussie !</h2>
          <p>
            Votre identité a été vérifiée avec succès. Vous allez être redirigé
            vers votre profil.
          </p>
        </div>
      )}

      {status === "pending" && (
        <div className="pending">
          <h2>⏳ Vérification en cours</h2>
          <p>
            Votre dossier est en cours d'examen. Vous recevrez une notification
            dès que la vérification sera terminée.
          </p>
        </div>
      )}

      {status === "canceled" && (
        <div className="canceled">
          <h2>❌ Vérification annulée</h2>
          <p>
            Vous avez annulé la vérification. Vous pouvez recommencer à tout
            moment depuis votre profil.
          </p>
        </div>
      )}

      {status === "failed" && (
        <div className="failed">
          <h2>❌ Vérification échouée</h2>
          <p>
            La vérification a échoué. Veuillez réessayer avec des documents
            valides et lisibles.
          </p>
        </div>
      )}
    </div>
  );
};

export default KycSuccess;
