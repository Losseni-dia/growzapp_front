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

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "Non définie";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className={styles.card}>
      {/* Poster */}
      <div className={styles.posterWrapper}>
        <img
          src={projet.poster || "/placeholder-project.jpg"}
          alt={projet.libelle}
          className={styles.poster}
        />
        <div className={styles.statutBadge}>
          {projet.statutProjet.replace(/_/g, " ")}
        </div>
      </div>

      {/* Contenu */}
      <div className={styles.content}>
        <h3 className={styles.title}>{projet.libelle}</h3>

        {/* Localisation */}
        <p className={styles.location}>
          <FiMapPin /> {projet.localiteNom}, {projet.paysNom}
        </p>

        {/* Description courte */}
        <p className={styles.description}>
          {projet.description.substring(0, 100)}
          {projet.description.length > 100 ? "..." : ""}
        </p>

        {/* Infos clés */}
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <strong>ROI Projeté</strong>
            <span className={styles.highlight}>
              <FiTrendingUp /> {projet.roiProjete}%
            </span>
          </div>
          <div className={styles.infoItem}>
            <strong>Prix/part</strong>
            <span>{projet.prixUnePart.toLocaleString()} €</span>
          </div>
          <div className={styles.infoItem}>
            <strong>Objectif </strong>
            <span>{projet.objectifFinancement.toLocaleString()} €</span>
          </div>
        </div>

        {/* Progress */}
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
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Dates */}
        <p className={styles.dates}>
          <FiCalendar /> Du {formatDate(projet.dateDebut)} au{" "}
          {formatDate(projet.dateFin)}
        </p>

        {/* Actions */}
        <div className={styles.actions}>
          <Link to={`/projet/${projet.id}`} className={styles.btnView}>
            <FiEye /> Voir le projet
          </Link>
          <Link to={`/projet/${projet.id}`} className={styles.btnInvest}>
            <FiDollarSign /> Investir
          </Link>
        </div>
      </div>
    </div>
  );
}
