import { useTranslation } from "react-i18next";
import {
  FiCalendar,
  FiDollarSign,
  FiEye,
  FiMapPin,
  FiTrendingUp
} from "react-icons/fi";
import { BsShieldCheck } from "react-icons/bs";
import { Link } from "react-router-dom";
import { ProjetDTO } from "../../../types/projet";
import { useCurrency } from "../../Context/CurrencyContext";
import styles from "./ProjetCard.module.css";

interface ProjectCardProps {
  projet: ProjetDTO;
}

export default function ProjectCard({ projet }: ProjectCardProps) {
  const { t, i18n } = useTranslation();
  const { format } = useCurrency();

  const translateData = (
    category: "sectors" | "countries" | "cities",
    value: string,
  ) => {
    if (!value) return "---";
    const searchKey = value.trim().toUpperCase();
    return t(`data.${category}.${searchKey}`, { defaultValue: value });
  };

  const progress =
    projet?.objectifFinancement > 0
      ? (Number(projet.montantCollecte || 0) /
          Number(projet.objectifFinancement)) *
        100
      : 0;

  const financementTermine =
    progress >= 100 || projet.statutProjet === "TERMINE";

  const getBadgeText = () => {
    if (financementTermine) return t("project_card.status.finished");
    if (!projet?.statutProjet) return "Statut inconnu";
    if (projet.statutProjet === "VALIDE") {
      return t("project_card.status.ongoing");
    }
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
  const descriptionAffichée = descriptionTexte.substring(0, 100);

  return (
    <div className={styles.card}>
      <div className={styles.posterWrapper}>
        {/* --- BADGE CERTIFIÉ (S'affiche si certifiedAt existe) --- */}
        {projet.certifiedAt && (
          <div
            className={styles.certifiedBadge}
            title="Projet audité et certifié sur l'honneur"
          >
            <BsShieldCheck className={styles.checkIcon} />
            <span>{t("project_card.certified") || "Certifié Growzapp"}</span>
          </div>
        )}

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
              {projet.roiProjete || 0}%
            </span>
          </div>

          <div className={styles.infoItem}>
            <strong>{t("project_details.equity_to_raise")} </strong>
            <span className={styles.equityValue}>
              {projet.valeurTotalePartsEnPourcent || 0}%
            </span>
          </div>

          <div className={styles.infoItem}>
            <strong>{t("project_card.price_per_share")} </strong>
            <span>
              {format(Number(projet.prixUnePart || 0), projet.currencyCode)}
            </span>
          </div>

          <div className={styles.infoItem}>
            <strong>{t("project_card.goal")} </strong>
            <span>
              {format(
                Number(projet.objectifFinancement || 0),
                projet.currencyCode,
              )}
            </span>
          </div>
        </div>

        <div className={styles.progressContainer}>
          <div className={styles.progressText}>
            <strong>
              {format(Number(projet.montantCollecte || 0), projet.currencyCode)}
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
          <Link to={`/projet/${projet.slug}`} className={styles.btnView}>
            <FiEye /> {t("project_card.btn_view")}
          </Link>

          <Link
            to={
              financementTermine ? "#" : `/projet/${projet.slug}?action=invest`
            }
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
