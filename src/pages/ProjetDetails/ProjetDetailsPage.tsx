// src/pages/ProjetDetailsPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../service/api"; // ← On importe seulement "api"
import { ProjetDTO } from "../../types/projet";
import InvestForm from "../../components/Investissement/InvestForm/InvestForm";
import toast from "react-hot-toast";
import styles from "./ProjetDetailsPage.module.css";
import { ApiResponse } from "../../types/common";

export default function ProjetDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [projet, setProjet] = useState<ProjetDTO | null>(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
   const loadProjet = async () => {
     if (!id) return;

     try {
       setLoading(true);

       // ON RÉCUPÈRE LA RÉPONSE COMPLÈTE + ON EXTRAIT .data
       const response = await api.get<ApiResponse<ProjetDTO>>(
         `/projets/${id}`
       );
       setProjet(response.data); // ← maintenant c'est le vrai ProjetDTO
     } catch (err: any) {
       toast.error(err.message || "Projet non trouvé");
     } finally {
       setLoading(false);
     }
   };

   loadProjet();
 }, [id]);

  if (loading) return <p className={styles.loading}>Chargement du projet...</p>;
  if (!projet) return <p className={styles.error}>Projet introuvable</p>;

  const formatNumber = (value?: number | null): string => {
    return (value ?? 0).toLocaleString("fr-FR");
  };

  const progress =
    projet.objectifFinancement > 0
      ? (projet.montantCollecte / projet.objectifFinancement) * 100
      : 0;

  const handleInvestSuccess = () => {
    toast.success("Investissement enregistré avec succès ! 🎉");
    // Recharger les données sans refresh complet (optionnel plus tard avec query invalidation)
    window.location.reload();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        // src/pages/ProjetDetailsPage.tsx
        {projet.poster ? (
          <img
            src={projet.poster}
            alt={projet.libelle}
            className={styles.poster}
            loading="lazy"
          />
        ) : (
          <div className={styles.noPoster}>Aucun poster disponible</div>
        )}
        <div className={styles.info}>
          <h1>{projet.libelle}</h1>
          <p>
            <strong>Secteur :</strong> {projet.secteurNom || "Non renseigné"}
          </p>
          <p>
            <strong>Porteur :</strong> {projet.porteurNom || "Anonyme"}
          </p>
          <p>
            <strong>Localisation :</strong> {projet.siteNom},{" "}
            {projet.localiteNom}
          </p>
          <p>
            <strong>Pays :</strong> {projet.paysNom || "Non renseigné"}
          </p>
          <div className={styles.roiBadge}>
            ROI Projeté : {projet.roiProjete}%
          </div>
        </div>
      </div>

      <div className={styles.stats}>
        <div>
          <strong>{formatNumber(projet.montantCollecte)} €</strong> collectés
        </div>
        <div>
          <strong>{formatNumber(projet.objectifFinancement)} €</strong> objectif
        </div>
        <div>
          <strong>{progress.toFixed(0)}%</strong> atteint
        </div>
      </div>

      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className={styles.description}>
        <h2>Description du projet</h2>
        <p>{projet.description}</p>
      </div>

      <div className={styles.investSection}>
        <h2>Investir dans ce projet</h2>
        <InvestForm projet={projet} onSuccess={handleInvestSuccess} />
      </div>
    </div>
  );
}
