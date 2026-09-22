import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiCreditCard,
  FiDollarSign,
  FiFolder,
  FiUsers,
  FiArrowRight,
  FiShield,
  FiCheckCircle,
  FiClock,
  FiMail,
  FiTruck,
  FiShoppingBag,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../components/Context/AuthContext";
import { useCurrency } from "../../components/Context/CurrencyContext";
import { api } from "../../service/Api";
import styles from "./AdminDashboard.module.css";

export default function DashboardAdmin() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { format } = useCurrency();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    investissementsEnAttente: 0,
    montantCollecteSequestre: 0,
    montantCollecteAffiche: 0,
    kycEnAttente: 0,
    projetsSoumis: 0,
    messagesEnAttente: 0,
    fournisseursEnAttente: 0,
    commandesEnAttente: 0,
  });
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.roles?.includes("ADMIN") ?? false;

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    fetchStats();
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [u, invCounts, s, a, k, p, c, fo, cmd] = await Promise.all([
        api
          .get<any>("/api/admin/users?page=0&size=1")
          .catch(() => ({ data: { totalElements: 0 } })),
        api
          .get<any>("/api/admin/investissements/counts")
          .catch(() => ({ data: {} })),
        api.get<any>("/api/admin/projet-wallet/solde-total").catch(() => 0),
        api
          .get<any>("/api/admin/projet-wallet/montant-total-collecte")
          .catch(() => 0),
        api.get<any>("/api/kyc/admin/en-attente").catch(() => ({ data: [] })),
        api.get<any>("/api/admin/projets").catch(() => ({ data: [] })),
        api
          .get<any>("/api/admin/contact?statut=NOUVEAU")
          .catch(() => ({ data: [] })),
        api
          .get<any>("/api/admin/fournisseurs/en-attente")
          .catch(() => ({ data: [] })),
        api
          .get<any>("/api/admin/commandes/en-attente")
          .catch(() => ({ data: [] })),
      ]);

      const projets = Array.isArray(p.data) ? p.data : [];
      const messages = Array.isArray(c.data) ? c.data : [];
      const fournisseurs = Array.isArray(fo.data) ? fo.data : [];
      const commandesEnAttente = Array.isArray(cmd.data) ? cmd.data : [];

      setStats({
        totalUsers: u.data?.totalElements || 0,
        investissementsEnAttente: invCounts.data?.EN_ATTENTE || 0,
        montantCollecteSequestre: Number(s) || 0,
        montantCollecteAffiche: Number(a) || 0,
        // GET /api/kyc/admin/en-attente retourne une Page<UserDTO> paginée
        // ({ content, totalElements, ... }), pas un tableau brut — .length
        // sur cet objet valait toujours undefined, d'où un compteur figé à 0
        // malgré des dizaines de dossiers réellement en attente.
        kycEnAttente: k.data?.totalElements ?? 0,
        projetsSoumis: projets.filter(
          (proj: any) => proj.statutProjet === "SOUMIS",
        ).length,
        messagesEnAttente: messages.length,
        fournisseursEnAttente: fournisseurs.length,
        commandesEnAttente: commandesEnAttente.length,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <p>{t("admin.dashboard.loading")}</p>
      </div>
    );
  }

  const pendingTotal =
    stats.investissementsEnAttente +
    stats.kycEnAttente +
    stats.projetsSoumis +
    stats.messagesEnAttente +
    stats.fournisseursEnAttente +
    stats.commandesEnAttente;

  return (
    <div className={styles.page}>
      {/* ═══════════ HEADER ═══════════ */}
      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <FiShield size={20} />
        </div>
        <div>
          <h1 className={styles.title}>{t("admin.dashboard.title")}</h1>
          <p className={styles.subtitle}>{t("admin.dashboard.subtitle")}</p>
        </div>
      </header>

      {/* ═══════════ TRÉSORERIE (hero) ═══════════ */}
      <section className={styles.treasuryCard}>
        <div className={styles.treasuryItem}>
          <span className={styles.treasuryLabel}>
            {t("admin.dashboard.real_escrow")}
          </span>
          <span className={styles.treasuryValue}>
            {format(stats.montantCollecteSequestre, "XOF")}
          </span>
        </div>
        <div className={styles.treasuryDivider} />
        <div className={styles.treasuryItem}>
          <span className={styles.treasuryLabel}>
            {t("admin.dashboard.displayed_amount")}
          </span>
          <span className={styles.treasuryValue}>
            {format(stats.montantCollecteAffiche, "XOF")}
          </span>
        </div>
      </section>

      {/* ═══════════ ALERTES — ACTIONS EN ATTENTE ═══════════ */}
      {pendingTotal > 0 && (
        <section className={styles.pendingBanner}>
          <strong>{pendingTotal}</strong>{" "}
          {t(
            pendingTotal > 1
              ? "admin.dashboard.pending_action_plural"
              : "admin.dashboard.pending_action",
          )}
        </section>
      )}

      {/* ═══════════ STATS GRID ═══════════ */}
      <section className={styles.statsGrid}>
        <Link to="/admin/users" className={styles.statCard}>
          <div className={styles.statIconWrap}>
            <FiUsers size={18} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statNumber}>{stats.totalUsers}</span>
            <span className={styles.statLabel}>
              {t("admin.dashboard.users")}
            </span>
          </div>
        </Link>

        <Link
          to="/admin/investissements"
          className={`${styles.statCard} ${stats.investissementsEnAttente > 0 ? styles.statCardAlert : ""}`}
        >
          <div className={styles.statIconWrap}>
            <FiDollarSign size={18} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statNumber}>
              {stats.investissementsEnAttente}
            </span>
            <span className={styles.statLabel}>
              {t("admin.dashboard.investments_pending")}
            </span>
          </div>
        </Link>

        <Link
          to="/admin/kyc"
          className={`${styles.statCard} ${stats.kycEnAttente > 0 ? styles.statCardAlert : ""}`}
        >
          <div className={styles.statIconWrap}>
            <FiCheckCircle size={18} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statNumber}>{stats.kycEnAttente}</span>
            <span className={styles.statLabel}>
              {t("admin.dashboard.kyc_pending")}
            </span>
          </div>
        </Link>

        <Link
          to="/admin/projets?tab=SOUMIS"
          className={`${styles.statCard} ${stats.projetsSoumis > 0 ? styles.statCardAlert : ""}`}
        >
          <div className={styles.statIconWrap}>
            <FiClock size={18} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statNumber}>{stats.projetsSoumis}</span>
            <span className={styles.statLabel}>
              {t("admin.dashboard.projects_pending")}
            </span>
          </div>
        </Link>

        <Link
          to="/admin/contact"
          className={`${styles.statCard} ${stats.messagesEnAttente > 0 ? styles.statCardAlert : ""}`}
        >
          <div className={styles.statIconWrap}>
            <FiMail size={18} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statNumber}>{stats.messagesEnAttente}</span>
            <span className={styles.statLabel}>
              {t("admin.dashboard.messages_pending")}
            </span>
          </div>
        </Link>

        <Link
          to="/admin/fournisseurs"
          className={`${styles.statCard} ${stats.fournisseursEnAttente > 0 ? styles.statCardAlert : ""}`}
        >
          <div className={styles.statIconWrap}>
            <FiTruck size={18} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statNumber}>{stats.fournisseursEnAttente}</span>
            <span className={styles.statLabel}>
              {t("admin.dashboard.fournisseurs_pending", "Fournisseurs en attente")}
            </span>
          </div>
        </Link>

        <Link
          to="/admin/commandes"
          className={`${styles.statCard} ${stats.commandesEnAttente > 0 ? styles.statCardAlert : ""}`}
        >
          <div className={styles.statIconWrap}>
            <FiShoppingBag size={18} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statNumber}>{stats.commandesEnAttente}</span>
            <span className={styles.statLabel}>
              {t("admin.dashboard.commandes_pending", "Commandes en attente")}
            </span>
          </div>
        </Link>
      </section>

      {/* ═══════════ ACTIONS RAPIDES ═══════════ */}
      <section className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>
          {t("admin.dashboard.quick_actions")}
        </h2>
        <div className={styles.actionsList}>
          <Link to="/admin/projets" className={styles.actionRow}>
            <span className={styles.actionIcon}>
              <FiFolder size={16} />
            </span>
            <span className={styles.actionLabel}>
              {t("admin.dashboard.manage_projects")}
            </span>
            <FiArrowRight size={15} className={styles.actionArrow} />
          </Link>

          <Link to="/admin/projets?tab=SOUMIS" className={styles.actionRow}>
            <span className={styles.actionIcon}>
              <FiClock size={16} />
            </span>
            <span className={styles.actionLabel}>
              {t("admin.dashboard.validate_projects")}
              {stats.projetsSoumis > 0 && (
                <span className={styles.actionBadge}>
                  {stats.projetsSoumis}
                </span>
              )}
            </span>
            <FiArrowRight size={15} className={styles.actionArrow} />
          </Link>

          <Link to="/admin/kyc" className={styles.actionRow}>
            <span className={styles.actionIcon}>
              <FiCheckCircle size={16} />
            </span>
            <span className={styles.actionLabel}>
              {t("admin.dashboard.verify_identities")}
              {stats.kycEnAttente > 0 && (
                <span className={styles.actionBadge}>{stats.kycEnAttente}</span>
              )}
            </span>
            <FiArrowRight size={15} className={styles.actionArrow} />
          </Link>

          <Link to="/admin/investissements" className={styles.actionRow}>
            <span className={styles.actionIcon}>
              <FiDollarSign size={16} />
            </span>
            <span className={styles.actionLabel}>
              {t("admin.dashboard.validate_investments")}
            </span>
            <FiArrowRight size={15} className={styles.actionArrow} />
          </Link>

          <Link to="/admin/contact" className={styles.actionRow}>
            <span className={styles.actionIcon}>
              <FiMail size={16} />
            </span>
            <span className={styles.actionLabel}>
              {t("admin.dashboard.answer_messages")}
              {stats.messagesEnAttente > 0 && (
                <span className={styles.actionBadge}>
                  {stats.messagesEnAttente}
                </span>
              )}
            </span>
            <FiArrowRight size={15} className={styles.actionArrow} />
          </Link>

          <Link to="/admin/project-wallets" className={styles.actionRow}>
            <span className={styles.actionIcon}>
              <FiCreditCard size={16} />
            </span>
            <span className={styles.actionLabel}>
              {t("admin.dashboard.project_treasury")}
            </span>
            <FiArrowRight size={15} className={styles.actionArrow} />
          </Link>
        </div>
      </section>
    </div>
  );
}
