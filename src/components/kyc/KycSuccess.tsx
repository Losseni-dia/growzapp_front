// KycSuccess.tsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { api } from "../../service/Api";

const KycSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { reloadUser } = useAuth();
  const status = searchParams.get("status");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Le webhook VOVE ID ne peut pas atteindre un backend en local
    // (localhost) et peut manquer même en production — on interroge donc
    // directement VOVE ID ici pour confirmer le vrai statut en base, avant
    // de recharger l'utilisateur en session (sinon le tableau de bord
    // continue d'afficher l'ancien statut malgré une vérification réussie).
    let cancelled = false;

    const refresh = async () => {
      try {
        await api.post("/api/kyc/refresh-status", {});
        await reloadUser();
      } catch (err) {
        console.error("Erreur lors du rafraîchissement du statut KYC", err);
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    refresh();

    const timer = setTimeout(() => {
      navigate("/mon-espace");
    }, 3000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  return (
    <div className="kyc-success-container">
      {status === "success" && (
        <div className="success">
          <h2>✅ Vérification réussie !</h2>
          <p>
            Votre identité a été vérifiée avec succès. Vous allez être redirigé
            vers votre espace.
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
            moment depuis votre espace.
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

      {checking && <p>Confirmation du statut en cours...</p>}
    </div>
  );
};

export default KycSuccess;
