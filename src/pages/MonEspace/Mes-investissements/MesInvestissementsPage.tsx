// src/pages/MonEspace/Mes-investissements/MesInvestissementsPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../service/api";
import { InvestissementDTO } from "../../../types/investissement";
import toast from "react-hot-toast";
import { format as formatDate } from "date-fns";
import { fr, enUS, es } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../../components/context/CurrencyContext"; // <--- IMPORT
import {
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
  FiDollarSign,
  FiDownload,
  FiEye,
} from "react-icons/fi";
import styles from "./MesInvestissementsPage.module.css";

export default function MesInvestissementsPage() {
  const [investissements, setInvestissements] = useState<InvestissementDTO[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const { t, i18n } = useTranslation();
  const { format: formatCurrency } = useCurrency(); // <--- HOOK MONNAIE

  const locales: any = { fr, en: enUS, es };
  const currentLocale = locales[i18n.language] || fr;

  const getToken = () => localStorage.getItem("access_token");
  const BASE_URL = "http://localhost:8080";

  useEffect(() => {
    api
      .get<{ data: InvestissementDTO[] }>(
        "/api/investissements/mes-investissements"
      )
      .then((res) => setInvestissements(res.data || []))
      .catch(() => toast.error(t("user_investments.toast_error")))
      .finally(() => setLoading(false));
  }, [t]);

  const handleVoir = async (numeroContrat: string) => {
    try {
      setDownloading(numeroContrat);
      const token = getToken();
      const lang = i18n.language || "fr";
      const response = await fetch(
        `${BASE_URL}/api/contrats/${numeroContrat}?lang=${lang}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      window.open(URL.createObjectURL(blob), "_blank");
    } catch (err) {
      toast.error(t("contract_view.error_generic"));
    } finally {
      setDownloading(null);
    }
  };

  const handleDownload = async (numeroContrat: string) => {
    try {
      setDownloading(numeroContrat);
      const token = getToken();
      const lang = i18n.language || "fr";
      const response = await fetch(
        `${BASE_URL}/api/contrats/${numeroContrat}/download?lang=${lang}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `Contrat_${numeroContrat}_${lang}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success(t("admin.project_detail.download_start"));
    } catch (err) {
      toast.error(t("admin.project_detail.download_error"));
    } finally {
      setDownloading(null);
    }
  };

  const getStatutConfig = (statut: string) => {
    switch (statut) {
      case "EN_ATTENTE":
        return {
          icon: FiClock,
          color: "#e67e22",
          bg: "#fff3e0",
          label: t("user_investments.status.pending"),
        };
      case "VALIDE":
        return {
          icon: FiCheckCircle,
          color: "#1b5e20",
          bg: "#e8f5e9",
          label: t("user_investments.status.validated"),
        };
      case "REJETE":
      case "ANNULE":
        return {
          icon: FiXCircle,
          color: "#c62828",
          bg: "#ffebee",
          label: t("user_investments.status.rejected"),
        };
      default:
        return { icon: FiClock, color: "#666", bg: "#f5f5f5", label: statut };
    }
  };

  if (loading)
    return <div className={styles.loading}>{t("dashboard.loading")}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{t("user_investments.title")}</h1>
        <p>
          <strong>{investissements.length}</strong>{" "}
          {t("user_investments.count")}
        </p>
      </div>

      {investissements.length === 0 ? (
        <div className={styles.emptyState}>
          <FiDollarSign size={80} />
          <h2>{t("user_investments.empty")}</h2>
          <Link to="/projets" className={styles.btnInvestir}>
            {t("user_investments.btn_discover")}
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {investissements.map((inv) => {
            const config = getStatutConfig(inv.statutPartInvestissement);
            const Icon = config.icon;
            return (
              <div key={inv.id} className={styles.card}>
                <div className={styles.poster}>
                  <img
                    src={inv.projetPoster || "/default.jpg"}
                    alt={inv.projetLibelle}
                  />
                  <div
                    className={styles.statutBadge}
                    style={{ background: config.bg, color: config.color }}
                  >
                    <Icon size={18} /> <span>{config.label}</span>
                  </div>
                </div>
                <div className={styles.content}>
                  <h3>{inv.projetLibelle}</h3>
                  <div className={styles.infoRow}>
                    <div>
                      <FiCalendar />{" "}
                      {formatDate(new Date(inv.date), "dd MMM yyyy", {
                        locale: currentLocale,
                      })}
                    </div>
                    <div>
                      <strong>{inv.nombrePartsPris}</strong>{" "}
                      {t("user_investments.card.parts")}
                    </div>
                  </div>
                  <div className={styles.montantInvesti}>
                    {/* CONVERSION ICI */}
                    <strong>
                      {formatCurrency(inv.montantInvesti, "XOF")}
                    </strong>{" "}
                    {t("user_investments.card.invested")}
                  </div>
                  <div className={styles.actions}>
                    {inv.statutPartInvestissement === "VALIDE" &&
                    inv.numeroContrat ? (
                      <div className={styles.btnGroup}>
                        <button
                          onClick={() => handleVoir(inv.numeroContrat!)}
                          className={styles.btnAction}
                          disabled={!!downloading}
                        >
                          <FiEye size={18} />
                        </button>
                        <button
                          onClick={() => handleDownload(inv.numeroContrat!)}
                          className={styles.btnAction}
                          disabled={!!downloading}
                        >
                          {downloading === inv.numeroContrat ? (
                            "..."
                          ) : (
                            <FiDownload size={18} />
                          )}
                        </button>
                      </div>
                    ) : (
                      <button disabled className={styles.btnDisabled}>
                        {t("user_investments.card.btn_unavailable")}
                      </button>
                    )}
                    <Link
                      to={`/projet/${inv.projetId}`}
                      className={styles.btnVoirProjet}
                    >
                      {t("user_investments.card.btn_view_project")}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
