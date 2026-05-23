import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiCreditCard,
  FiDollarSign,
  FiFolder,
  FiPackage,
  FiUsers
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../components/Context/AuthContext";
import { useCurrency } from "../../components/Context/CurrencyContext";
import { api } from "../../service/Api";
import styles from "./AdminDashboard.module.css";

export default function DashboardAdmin() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { format } = useCurrency();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjets: 0,
    totalContrats: 0,
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
      const [u, i, r, c, s, a, k] = await Promise.all([
        api.get<any>("/api/admin/users").catch(() => ({ data: [] })),
        api.get<any>("/api/admin/investissements").catch(() => ({ data: [] })),
        api.get<any>("/api/transactions/retraits-en-attente").catch(() => []),
        api
          .get<any>("/api/contrats/admin/liste?page=0&size=1")
          .catch(() => null),
        api.get<any>("/api/admin/projet-wallet/solde-total").catch(() => 0),
        api
          .get<any>("/api/admin/projet-wallet/montant-total-collecte")
          .catch(() => 0),
        api.get<any>("/api/kyc/admin/en-attente").catch(() => []),
      ]);

      setStats({
        totalUsers: u.data?.length || 0,
        totalProjets: 0, // Sera mis à jour par le count réel si besoin
        totalContrats: c?.totalElements || 0,
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

  if (loading)
    return <div className={styles.loading}>Chargement du Hub...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.mainTitle}>{t("admin.dashboard.title")}</h1>

      <div className={styles.statsGrid}>
        <Link to="/admin/users" className={styles.statCard}>
          <FiUsers className={styles.icon} />
          <div>
            <h3>{stats.totalUsers}</h3>
            <p>{t("admin.dashboard.users")}</p>
          </div>
        </Link>

        <Link
          to="/admin/projets"
          className={`${styles.statCard} ${styles.primary}`}
        >
          <FiFolder className={styles.icon} />
          <div>
            <h3>Gestion</h3>
            <p>{t("admin.dashboard.projects")}</p>
          </div>
        </Link>

        <Link
          to="/admin/investissements"
          className={`${styles.statCard} ${styles.warning}`}
        >
          <FiDollarSign className={styles.icon} />
          <div>
            <h3>{stats.investissementsEnAttente}</h3>
            <p>Invest. en attente</p>
          </div>
        </Link>

        <Link
          to="/admin/retraits"
          className={`${styles.statCard} ${styles.danger}`}
        >
          <FiCreditCard className={styles.icon} />
          <div>
            <h3>{stats.retraitsEnAttente}</h3>
            <p>Retraits à valider</p>
          </div>
        </Link>

        <div className={`${styles.statCard} ${styles.tresorerie}`}>
          <FiPackage className={styles.icon} />
          <div>
            <h3>{format(stats.montantCollecteSequestre, "XOF")}</h3>
            <p>Séquestre Réel</p>
          </div>
        </div>
      </div>

      <div className={styles.quickActions}>
        <h2>{t("admin.dashboard.quick_actions")}</h2>
        <div className={styles.actionsGrid}>
          <Link to="/admin/projets">📁 Gérer les projets</Link>
          <Link to="/admin/kyc">
            🆔 Vérifier les identités ({stats.kycEnAttente})
          </Link>
          <Link to="/admin/investissements">💰 Valider les fonds</Link>
        </div>
      </div>
    </div>
  );
}
