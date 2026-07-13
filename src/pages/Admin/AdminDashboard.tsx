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
    retraitsEnAttente: 0,
    montantCollecteSequestre: 0,
    montantCollecteAffiche: 0,
    kycEnAttente: 0,
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
      const [u, i, r, s, a, k] = await Promise.all([
        api.get<any>("/api/admin/users").catch(() => ({ data: [] })),
        api.get<any>("/api/admin/investissements").catch(() => ({ data: [] })),
        api.get<any>("/api/transactions/retraits-en-attente").catch(() => []),
        api.get<any>("/api/admin/projet-wallet/solde-total").catch(() => 0),
        api
          .get<any>("/api/admin/projet-wallet/montant-total-collecte")
          .catch(() => 0),
        api.get<any>("/api/kyc/admin/en-attente").catch(() => []),
      ]);

      setStats({
        totalUsers: u.data?.length || 0,
        investissementsEnAttente: (i.data || []).filter(
          (inv: any) => inv.statutPartInvestissement === "EN_ATTENTE",
        ).length,
        retraitsEnAttente: r.length || 0,
        montantCollecteSequestre: Number(s) || 0,
        montantCollecteAffiche: Number(a) || 0,
        kycEnAttente: k.length || 0,
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
    stats.retraitsEnAttente +
    stats.kycEnAttente;

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
          to="/admin/retraits"
          className={`${styles.statCard} ${stats.retraitsEnAttente > 0 ? styles.statCardAlert : ""}`}
        >
          <div className={styles.statIconWrap}>
            <FiCreditCard size={18} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statNumber}>{stats.retraitsEnAttente}</span>
            <span className={styles.statLabel}>
              {t("admin.dashboard.withdrawals_pending")}
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
