// src/pages/porteur/MesProjetsPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, buildProjetUrl } from "../../../service/Api";
import { ProjetDTO } from "../../../types/projet";
import toast from "react-hot-toast";
import { format as formatDate } from "date-fns";
import { fr, enUS, es } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../../components/Context/CurrencyContext"; // <--- IMPORT
import {
  FiTrendingUp,
  FiCalendar,
  FiDollarSign,
  FiEye,
  FiUsers,
  FiMapPin,
  FiX,
  FiCreditCard,
  FiSmartphone,
} from "react-icons/fi";
import { BsStarFill } from "react-icons/bs";
import styles from "./MesProjetsPage.module.css";
import { buildFileUrl } from "../../../service/Api";

export default function MesProjetsPage() {
  const { t, i18n } = useTranslation();
  const { format: formatCurrency } = useCurrency(); // <--- HOOK MONNAIE
  const [projets, setProjets] = useState<ProjetDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [premiumTarget, setPremiumTarget] = useState<ProjetDTO | null>(null);
  const [premiumLoading, setPremiumLoading] = useState<string | null>(null);
  const PRIX_PREMIUM = 5000;

  const locales: any = { fr, en: enUS, es };
  const currentLocale = locales[i18n.language] || fr;

  useEffect(() => {
    api
      .get<{ data: ProjetDTO[] }>(buildProjetUrl("/api/projets/mes-projets"))
      .then((response) => setProjets(response.data || []))
      .catch(() => toast.error(t("projects_page.toast_error")))
      .finally(() => setLoading(false));
  }, [t]);

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case "BROUILLON":
        return t("user_projects.status.draft", "Brouillon");
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

  const acheterPremium = async (methode: "wallet" | "carte" | "mobile") => {
    if (!premiumTarget) return;
    setPremiumLoading(methode);
    try {
      if (methode === "wallet") {
        await api.post(buildProjetUrl(`/api/projets/${premiumTarget.id}/premium/wallet`));
        toast.success("Statut Premium activé !");
        setPremiumTarget(null);
        setProjets((prev) =>
          prev.map((p) =>
            p.id === premiumTarget.id ? { ...p, premiumActif: true } : p,
          ),
        );
      } else {
        const endpoint = methode === "carte" ? "carte" : "mobile";
        const response = await api.post<{ redirectUrl?: string; error?: string }>(
          buildProjetUrl(`/api/projets/${premiumTarget.id}/premium/${endpoint}`),
        );
        if (response.redirectUrl) {
          window.location.href = response.redirectUrl;
        } else {
          toast.error(response.error || "Erreur lors de la redirection");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'activation du Premium");
    } finally {
      setPremiumLoading(null);
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
                    src={projet.poster ? buildFileUrl(projet.poster) : "/default-projet.jpg"}
                    alt={projet.libelleTradu || projet.libelle}
                    className={styles.posterImg}
                  />
                  {projet.premiumActif && (
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        background: "linear-gradient(135deg, #1b5e20, #2e7d32)",
                        color: "#ffc107",
                        padding: "4px 10px",
                        borderRadius: 999,
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                      }}
                    >
                      <BsStarFill /> Premium
                    </div>
                  )}
                  <div
                    className={`${styles.statutBadge} ${
                      styles[projet.statutProjet?.toLowerCase()] || ""
                    }`}
                  >
                    {getStatutLabel(projet.statutProjet)}
                  </div>
                </div>
                <div className={styles.content}>
                  <h3 className={styles.title}>
                    {projet.libelleTradu || projet.libelle}
                  </h3>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <FiCalendar className={styles.icon} />
                      <div>
                        <small>{t("user_projects.card.created_at")}</small>
                        <div>
                          {formatDate(
                            new Date(projet.createdAt),
                            "dd MMM yyyy",
                            { locale: currentLocale },
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
                  {projet.statutProjet === "BROUILLON" ? (
                    <Link to={`/projet/creer?brouillonId=${projet.id}`} className={styles.btnVoir}>
                      <FiEye /> {t("user_projects.card.btn_continue", "Continuer le brouillon")}
                    </Link>
                  ) : (
                    <Link to={`/projet/${projet.slug}`} className={styles.btnVoir}>
                      <FiEye /> {t("user_projects.card.btn_view")}
                    </Link>
                  )}

                  {projet.googleMapsUrl && (
                    <a
                      href={projet.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.btnSite}
                    >
                      <FiMapPin />{" "}
                      {t("user_projects.card.btn_site") || "Localisation"}
                    </a>
                  )}

                  {projet.statutProjet === "VALIDE" && !projet.premiumActif && (
                    <button
                      onClick={() => setPremiumTarget(projet)}
                      className={styles.btnVoir}
                      style={{
                        marginTop: 8,
                        background: "linear-gradient(135deg, #1b5e20, #2e7d32)",
                        color: "#ffc107",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        fontWeight: 700,
                      }}
                    >
                      <BsStarFill /> Passer en Premium
                    </button>
                  )}
                  {projet.premiumActif && projet.premiumFin && (
                    <p style={{ fontSize: "0.8rem", color: "#666", marginTop: 8 }}>
                      Premium actif jusqu'au{" "}
                      {new Date(projet.premiumFin).toLocaleDateString(i18n.language)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════ MODAL ACHAT PREMIUM ═══════════ */}
      {premiumTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setPremiumTarget(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "1.5rem",
              maxWidth: 420,
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.75rem",
              }}
            >
              <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                <BsStarFill color="#ffc107" /> Passer en Premium
              </h3>
              <button
                onClick={() => setPremiumTarget(null)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <FiX size={20} />
              </button>
            </div>

            <p style={{ fontSize: "0.9rem", color: "#555" }}>
              « {premiumTarget.libelleTradu || premiumTarget.libelle} » sera mis en
              avant en tête du catalogue pendant <strong>3 mois</strong> pour{" "}
              <strong>{PRIX_PREMIUM.toLocaleString("fr-FR")} FCFA</strong>.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              <button
                onClick={() => acheterPremium("wallet")}
                disabled={premiumLoading !== null}
                className={styles.btnVoir}
                style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}
              >
                <FiDollarSign />
                {premiumLoading === "wallet" ? "Traitement..." : "Payer avec mon Wallet GrowzApp"}
              </button>
              <button
                onClick={() => acheterPremium("mobile")}
                disabled={premiumLoading !== null}
                className={styles.btnVoir}
                style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}
              >
                <FiSmartphone />
                {premiumLoading === "mobile" ? "Redirection..." : "Payer par Mobile Money"}
              </button>
              <button
                onClick={() => acheterPremium("carte")}
                disabled={premiumLoading !== null}
                className={styles.btnVoir}
                style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}
              >
                <FiCreditCard />
                {premiumLoading === "carte" ? "Redirection..." : "Payer par carte bancaire"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
