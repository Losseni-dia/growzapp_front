// src/pages/porteur/MesProjetsPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../service/api";
import { ProjetDTO } from "../../../types/projet";
import toast from "react-hot-toast";
import { format as formatDate } from "date-fns";
import { fr, enUS, es } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../../components/context/CurrencyContext"; // <--- IMPORT
import {
  FiTrendingUp,
  FiCalendar,
  FiDollarSign,
  FiEye,
  FiUsers,
} from "react-icons/fi";
import styles from "./MesProjetsPage.module.css";

export default function MesProjetsPage() {
  const { t, i18n } = useTranslation();
  const { format: formatCurrency } = useCurrency(); // <--- HOOK MONNAIE
  const [projets, setProjets] = useState<ProjetDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const locales: any = { fr, en: enUS, es };
  const currentLocale = locales[i18n.language] || fr;

  useEffect(() => {
    api
      .get<{ data: ProjetDTO[] }>("/api/projets/mes-projets")
      .then((response) => setProjets(response.data || []))
      .catch(() => toast.error(t("projects_page.toast_error")))
      .finally(() => setLoading(false));
  }, [t]);

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case "VALIDE":
      case "EN_COURS":
        return t("user_projects.status.ongoing");
      case "TERMINE":
        return t("user_projects.status.funded");
      case "SOUMIS":
        return t("user_projects.status.pending");
      case "REJETE":
        return t("user_projects.status.rejected");
      default:
        return statut;
    }
  };

  if (loading)
    return <div className={styles.loading}>{t("dashboard.loading")}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>
          <FiTrendingUp /> {t("user_projects.title")}
        </h1>
        <p>{t("user_projects.count", { count: projets.length })}</p>
      </div>

      {projets.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <FiDollarSign />
          </div>
          <h2>{t("user_projects.empty.title")}</h2>
          <Link to="/projet/creer" className={styles.btnCreer}>
            {t("user_projects.empty.btn")}
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
                    className={`${styles.statutBadge} ${
                      styles[projet.statutProjet?.toLowerCase()] || ""
                    }`}
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
                        <small>{t("user_projects.card.created_at")}</small>
                        <div>
                          {formatDate(
                            new Date(projet.createdAt),
                            "dd MMM yyyy",
                            { locale: currentLocale }
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={styles.infoItem}>
                      <FiUsers className={styles.icon} />
                      <div>
                        <small>{t("user_projects.card.investors")}</small>
                        <div>
                          <strong>{projet.investissements?.length || 0}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.progressContainer}>
                    <div className={styles.progressText}>
                      {/* CONVERSION COLLECTÉ */}
                      <span>
                        {formatCurrency(projet.montantCollecte, "XOF")}
                      </span>
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
                    {t("user_projects.card.goal")} : {/* CONVERSION OBJECTIF */}
                    <strong>
                      {formatCurrency(projet.objectifFinancement, "XOF")}
                    </strong>
                  </div>
                  <Link to={`/projet/${projet.id}`} className={styles.btnVoir}>
                    <FiEye /> {t("user_projects.card.btn_view")}
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
