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

  const objectifAtteint = progress >= 100;
  const estTermine = projet.statutProjet === "TERMINE";
  const estValide = projet.statutProjet === "VALIDE";
  const financementTermine = estTermine || objectifAtteint;

  // Badge intelligent selon le statut
  const getBadgeText = () => {
    if (financementTermine) return "Financement terminé";
    if (estValide) return "Financement en cursus";
    return projet.statutProjet.replace(/_/g, " ");
  };

  const getBadgeClass = () => {
    if (financementTermine) return styles.badgeTermine;
    if (estValide) return styles.badgeEnCours;
    return styles.badgeDefault;
  };

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
      {/* Poster + Badge */}
      <div className={styles.posterWrapper}>
        <img
          src={
            projet.poster
              ? `${projet.poster}?t=${Date.now()}` // FORCE LE RECHARGEMENT (anti-cache)
              : "/placeholder-project.jpg"
          }
          alt={projet.libelle}
          className={styles.poster}
          key={projet.poster || "placeholder"} // Force React à re-render l'image
        />
        <div className={`${styles.statutBadge} ${getBadgeClass()}`}>
          {getBadgeText()}
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
            <strong>Prix/part </strong>
            <span>{projet.prixUnePart.toLocaleString()} €</span>
          </div>
          <div className={styles.infoItem}>
            <strong>Objectif </strong>
            <span>{projet.objectifFinancement.toLocaleString()} €</span>
          </div>
        </div>

        {/* Barre de progression */}
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
                objectifAtteint ? styles.progressFull : ""
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Dates */}
        <p className={styles.dates}>
          <FiCalendar /> Du {formatDate(projet.dateDebut)} au{" "}
          {formatDate(projet.dateFin)}
        </p>

        {/* Actions – désactivées si terminé */}
        <div className={styles.actions}>
          <Link
            to={`/projet/${projet.id}`}
            className={`${styles.btnView} ${
              financementTermine ? styles.btnDisabled : ""
            }`}
            {...(financementTermine ? { "aria-disabled": true } : {})}
            onClick={(e) => financementTermine && e.preventDefault()}
          >
            <FiEye /> Voir le projet
          </Link>

          <Link
            to={financementTermine ? "#" : `/projet/${projet.id}#investir`}
            className={`${styles.btnInvest} ${
              financementTermine ? styles.btnDisabled : ""
            }`}
            {...(financementTermine ? { "aria-disabled": true } : {})}
            onClick={(e) => financementTermine && e.preventDefault()}
          >
            <FiDollarSign /> Investir
          </Link>
        </div>
      </div>
    </div>
  );
}