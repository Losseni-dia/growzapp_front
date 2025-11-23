// src/components/Projet/ProjectCard/ProjectCard.tsx
import {
  FiEye,
  FiDollarSign,
  FiMapPin,
  FiCalendar,
  FiTrendingUp,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { ProjetDTO } from "../../../types/projet";
import styles from "./ProjetCard.module.css";

interface ProjectCardProps {
  projet: ProjetDTO;
}

export default function ProjectCard({ projet }: ProjectCardProps) {
  const progress =
    projet.objectifFinancement > 0
      ? (projet.montantCollecte / projet.objectifFinancement) * 100
      : 0;

  const financementTermine =
    progress >= 100 || projet.statutProjet === "TERMINE";

  const getBadgeText = () => {
    if (financementTermine) return "Financement terminé";
    if (projet.statutProjet === "VALIDE") return "En cours";
    return projet.statutProjet.replace(/_/g, " ");
  };

  const getBadgeClass = () => {
    if (financementTermine) return styles.badgeTermine;
    if (projet.statutProjet === "VALIDE") return styles.badgeEnCours;
    return styles.badgeDefault;
  };

  const formatDate = (dateStr?: string) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "Non définie";

  return (
    <div className={styles.card}>
      {/* POSTER — LA VERSION QUI MARCHE À 100% */}
      <div className={styles.posterWrapper}>
        {projet.poster ? (
          <img
            src={projet.poster}
            alt={projet.libelle}
            className={styles.poster}
          />
        ) : (
          <div className={styles.noPoster}>
            <span>Aucun poster</span>
          </div>
        )}

        <div className={`${styles.statutBadge} ${getBadgeClass()}`}>
          {getBadgeText()}
        </div>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{projet.libelle}</h3>
        <p className={styles.location}>
          <FiMapPin /> {projet.localiteNom}, {projet.paysNom}
        </p>
        <p className={styles.description}>
          {projet.description.substring(0, 100)}
          {projet.description.length > 100 ? "..." : ""}
        </p>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.highlight}>
              <strong>ROI</strong> <FiTrendingUp /> {projet.roiProjete}%
            </span>
          </div>
          <div className={styles.infoItem}>
            <strong>Prix/part </strong>
            <span>{projet.prixUnePart.toLocaleString()} €</span>
          </div>
          <div className={styles.infoItem}>
            <strong>Objectif  </strong>
            <span>{projet.objectifFinancement.toLocaleString()} €</span>
          </div>
        </div>

        <div className={styles.progressContainer}>
          <div className={styles.progressText}>
            <strong>
              {Math.round(projet.montantCollecte).toLocaleString()} €
            </strong>{" "}
            collectés
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={`${styles.progressFill} ${
                progress >= 100 ? styles.progressFull : ""
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        <p className={styles.dates}>
          <FiCalendar /> Du {formatDate(projet.dateDebut)} au{" "}
          {formatDate(projet.dateFin)}
        </p>

        <div className={styles.actions}>
          <Link to={`/projet/${projet.id}`} className={styles.btnView}>
            <FiEye /> Voir
          </Link>
          <Link
            to={financementTermine ? "#" : `/projet/${projet.id}#investir`}
            className={`${styles.btnInvest} ${
              financementTermine ? styles.btnDisabled : ""
            }`}
            onClick={(e) => financementTermine && e.preventDefault()}
          >
            <FiDollarSign /> Investir
          </Link>
        </div>
      </div>
    </div>
  );
}
