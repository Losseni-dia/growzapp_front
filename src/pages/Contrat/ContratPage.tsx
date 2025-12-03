// src/pages/Contrat/ContratPage.tsx → VERSION FINALE PARFAITE (2025)

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../../service/api";
import toast from "react-hot-toast";
import ContratView from "../../components/Contrat/ContratView/ContratView";
import styles from "./ContratPage.module.css";

export default function ContratPage() {
  const { numero } = useParams<{ numero: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContrat = async () => {
      if (!numero) {
        toast.error("Lien invalide");
        navigate("/mon-espace");
        return;
      }

      try {
        setLoading(true);
        const res = await api.get<any>(`/api/contrats/details/${numero}`);
        setData(res);
      } catch (err: any) {
        let message = "Impossible de charger le contrat";

        if (err.message) {
          if (err.message.includes("404")) {
            message = "Ce contrat n'existe pas";
          } else if (err.message.includes("403")) {
            message = "Vous n'avez pas accès à ce contrat";
          } else if (err.message.includes("401")) {
            message = "Session expirée, veuillez vous reconnecter";
          } else {
            message = err.message;
          }
        }

        toast.error(message);
        console.error("Erreur chargement contrat:", err);

        // Redirection propre si erreur grave
        navigate("/mon-espace", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchContrat();
  }, [numero, navigate]);

  // État de chargement
  if (loading) {
    return (
      <div className={styles.message}>
        <div className={styles.loader} />
        <p>Chargement du contrat...</p>
      </div>
    );
  }

  // Contrat non trouvé ou erreur
  if (!data) {
    return (
      <div className={styles.message}>
        <h2>Contrat introuvable</h2>
        <p>Le contrat demandé n'existe pas ou vous n'y avez pas accès.</p>
        <Link to="/mon-espace" className={styles.backLink}>
          Retour à mon espace
        </Link>
      </div>
    );
  }

  // Tout est bon → affichage du contrat
  return <ContratView {...data} />;
}
