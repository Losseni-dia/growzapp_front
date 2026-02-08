import { useTranslation } from "react-i18next";
import {
  FiCalendar,
  FiDollarSign,
  FiEye,
  FiMapPin,
  FiTrendingUp,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { ProjetDTO } from "../../../types/projet";
import { useCurrency } from "../../Context/CurrencyContext"; // Import du nouveau context
import styles from "./ProjetCard.module.css";

interface ProjectCardProps {
  projet: ProjetDTO;
}

export default function ProjectCard({ projet }: ProjectCardProps) {
  const { t, i18n } = useTranslation();
  const { format } = useCurrency(); // Hook de conversion et formatage

  const translateData = (
    category: "sectors" | "countries" | "cities",
    value: string
  ) => {
    if (!value) return "---";
    const searchKey = value.trim().toUpperCase();
    return t(`data.${category}.${searchKey}`, { defaultValue: value });
  };

  // Calcul du progrès (on reste sur les valeurs brutes car le ratio est le même)
  const progress =
    projet.objectifFinancement > 0
      ? (Number(projet.montantCollecte) / Number(projet.objectifFinancement)) *
        100
      : 0;

  const financementTermine =
    progress >= 100 || projet.statutProjet === "TERMINE";

 const getBadgeText = () => {
  // 1. Priorité au financement terminé
  if (financementTermine) return t("project_card.status.finished");

  // 2. Sécurité : si le statut n'existe pas du tout dans les données
  if (!projet?.statutProjet) return "Statut inconnu";

  // 3. Cas spécifique "VALIDE"
  if (projet.statutProjet === "VALIDE") {
    return t("project_card.status.ongoing");
  }

  // 4. Fallback sécurisé : on s'assure que c'est bien une chaîne avant le .replace
  // L'utilisation de String() ou du check au dessus évite le crash
  return String(projet.statutProjet).replace(/_/g, " ");
  };
  
  const formatDate = (dateStr?: string) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString(i18n.language, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "---";
  
  const descriptionTexte = projet?.description || "";
  const descriptionAffichée = descriptionTexte.substring(0, 100)

  return (
    <div className={styles.card}>
      <div className={styles.posterWrapper}>
        {projet.poster ? (
          <img
            src={projet.poster}
            alt={projet.libelle}
            className={styles.poster}
          />
        ) : (
          <div className={styles.noPoster}>
            <span>{t("project_card.no_poster")}</span>
          </div>
        )}
        <div
          className={`${styles.statutBadge} ${
            financementTermine
              ? styles.badgeTermine
              : projet.statutProjet === "VALIDE"
              ? styles.badgeEnCours
              : styles.badgeDefault
          }`}
        >
          {getBadgeText()}
        </div>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{projet.libelle}</h3>
        <p className={styles.location}>
          <FiMapPin /> {translateData("cities", projet.localiteNom ?? "")},{" "}
          {translateData("countries", projet.paysNom ?? "")}
        </p>
        <p className={styles.sector}>
          <strong>{t("project_details.sector")} :</strong>{" "}
          {translateData("sectors", projet.secteurNom ?? "")}
        </p>
        <p className={styles.description}>
            {descriptionAffichée}
            {descriptionTexte.length > 100 ? "..." : ""}
          </p>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.highlight}>
              <strong>{t("project_card.roi")}</strong> <FiTrendingUp />{" "}
              {projet.roiProjete}%
            </span>
          </div>

          {/*Pourcentage du montant à lever (Equity) */}
          <div className={styles.infoItem}>
            <strong>{t("project_details.equity_to_raise")} </strong>
            <span className={styles.equityValue}>
              {projet.valeurTotalePartsEnPourcent}%
            </span>
          </div>

          <div className={styles.infoItem}>
            <strong>{t("project_card.price_per_share")} </strong>
            {/* Utilisation de format(montant, devise_origine) */}
            <span>
              {format(Number(projet.prixUnePart), projet.currencyCode)}
            </span>
          </div>

          <div className={styles.infoItem}>
            <strong>{t("project_card.goal")} </strong>
            <span>
              {format(Number(projet.objectifFinancement), projet.currencyCode)}
            </span>
          </div>
        </div>

        <div className={styles.progressContainer}>
          <div className={styles.progressText}>
            <strong>
              {/* Le montant collecté est aussi converti automatiquement */}
              {format(Number(projet.montantCollecte), projet.currencyCode)}
            </strong>{" "}
            {t("project_card.collected")} <span>{progress.toFixed(0)}%</span>
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
          <FiCalendar />{" "}
          {t("project_card.dates", {
            start: formatDate(projet.dateDebut),
            end: formatDate(projet.dateFin),
          })}
        </p>

       <div className={styles.actions}>
          {/* Bouton VOIR : mène à la page complète */}
          <Link to={`/projet/${projet.id}`} className={styles.btnView}>
            <FiEye /> {t("project_card.btn_view")}
          </Link>

          {/* Bouton INVESTIR : mène au mode Checkout simplifié */}
          <Link
            to={financementTermine ? "#" : `/projet/${projet.id}?action=invest`}
            className={`${styles.btnInvest} ${
              financementTermine ? styles.btnDisabled : ""
            }`}
            onClick={(e) => financementTermine && e.preventDefault()}
          >
            <FiDollarSign /> {t("project_card.btn_invest")}
          </Link>
        </div>
      </div>
    </div>
  );
}

