// src/pages/porteur/MesProjetsPage.tsx → VERSION FINALE (comme tu veux)
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../service/api";
import { ProjetDTO } from "../../../types/projet";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  FiTrendingUp,
  FiCalendar,
  FiDollarSign,
  FiEye,
  FiUsers,
} from "react-icons/fi";
import styles from "./MesProjetsPage.module.css";

export default function MesProjetsPage() {
  const [projets, setProjets] = useState<ProjetDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: ProjetDTO[] }>("/api/projets/mes-projets")
      .then((response) => {
        setProjets(response.data || []);
      })
      .catch(() => {
        toast.error("Impossible de charger vos projets");
      })
      .finally(() => setLoading(false));
  }, []);

  const getStatutClass = (statut: string) => {
    switch (statut) {
      case "VALIDE":
      case "EN_COURS":
        return styles.statutEnCours;
      case "TERMINE":
        return styles.statutTermine;
      case "SOUMIS":
        return styles.statutSoumis;
      case "REJETE":
        return styles.statutRejete;
      default:
        return styles.statutDefault;
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case "VALIDE":
      case "EN_COURS":
        return "En cours de financement";
      case "TERMINE":
        return "Financé";
      case "SOUMIS":
        return "En attente de validation";
      case "REJETE":
        return "Refusé";
      default:
        return statut;
    }
  };

  if (loading) {
    return <div className={styles.loading}>Chargement de vos projets...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>
          <FiTrendingUp /> Mes Projets
        </h1>
        <p>
          Vous avez créé <strong>{projets.length}</strong> projet(s)
        </p>
      </div>

      {projets.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <FiDollarSign />
          </div>
          <h2>Vous n'avez pas encore créé de projet</h2>
          <p>Lancez votre campagne d'investissement dès maintenant !</p>
          <Link to="/projet/creer" className={styles.btnCreer}>
            Créer un nouveau projet
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {projets.map((projet) => {
            const progress =
              projet.objectifFinancement > 0
                ? (projet.montantCollecte / projet.objectifFinancement) * 100
                : 0;

            return (
              <div key={projet.id} className={styles.card}>
                <div className={styles.poster}>
                  <img
                    src={projet.poster || "/default-projet.jpg"}
                    alt={projet.libelle}
                    className={styles.posterImg}
                  />
                  <div
                    className={`${styles.statutBadge} ${getStatutClass(
                      projet.statutProjet
                    )}`}
                  >
                    {getStatutLabel(projet.statutProjet)}
                  </div>
                </div>

                <div className={styles.content}>
                  <h3 className={styles.title}>{projet.libelle}</h3>

                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <FiCalendar className={styles.icon} />
                      <div>
                        <small>Créé le</small>
                        <div>
                          {format(new Date(projet.createdAt), "dd MMM yyyy", {
                            locale: fr,
                          })}
                        </div>
                      </div>
                    </div>
                    <div className={styles.infoItem}>
                      <FiUsers className={styles.icon} />
                      <div>
                        <small>Investisseurs</small>
                        <div>
                          <strong>{projet.investissements?.length || 0}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.progressContainer}>
                    <div className={styles.progressText}>
                      <span>{projet.montantCollecte.toLocaleString()} €</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className={styles.objectif}>
                    Objectif :{" "}
                    <strong>
                      {projet.objectifFinancement.toLocaleString()} €
                    </strong>
                  </div>

                  <Link to={`/projet/${projet.id}`} className={styles.btnVoir}>
                    <FiEye /> Voir le projet
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
