// src/pages/admin/DashboardAdmin.tsx → VERSION FIN booALE PARFAITE SANS PAGINATION
import { useEffect, useState } from "react";
import { useAuth } from "../../components/context/AuthContext";
import { api } from "../../service/api";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import styles from "./AdminDashboard.module.css";
import {
  FiUsers,
  FiFolder,
  FiDollarSign,
  FiShield,
  FiTrendingUp,
  FiAlertCircle,
} from "react-icons/fi";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface Stats {
  totalUsers: number;
  totalProjets: number;
  totalInvestissements: number;
  investissementsEnAttente: number;
  montantTotalCollecte: number;
}

export default function DashboardAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalProjets: 0,
    totalInvestissements: 0,
    investissementsEnAttente: 0,
    montantTotalCollecte: 0,
  });
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.roles?.includes("ADMIN") ?? false;

  useEffect(() => {
    if (!isAdmin) {
      toast.error("Accès refusé");
      navigate("/");
      return;
    }
    fetchStats();
  }, [isAdmin, navigate]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const [usersRes, projetsRes, investissementsRes] = await Promise.all([
        api.get<ApiResponse<any[]>>("/admin/users"),
        api.get<ApiResponse<any[]>>("/admin/projets"),
        api.get<ApiResponse<any[]>>("/admin/investissements"),
      ]);

      const users = usersRes.data || [];
      const projets = projetsRes.data || [];
      const investissements = investissementsRes.data || [];

      const enAttente = investissements.filter(
        (i: any) => i.statutPartInvestissement === "EN_ATTENTE"
      ).length;

      const totalCollecte = projets.reduce(
        (acc: number, p: any) => acc + (p.montantCollecte || 0),
        0
      );

      setStats({
        totalUsers: users.length,
        totalProjets: projets.length,
        totalInvestissements: investissements.length,
        investissementsEnAttente: enAttente,
        montantTotalCollecte: totalCollecte,
      });
    } catch (err) {
      toast.error("Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className={styles.container}>
      <h1 className={styles.mainTitle}>
        <FiShield /> Espace Administrateur
      </h1>

      {loading ? (
        <p className={styles.loading}>Chargement des statistiques...</p>
      ) : (
        <>
          <div className={styles.statsGrid}>
            <Link to="/admin/users" className={styles.statCard}>
              <FiUsers className={styles.icon} />
              <div>
                <h3>{stats.totalUsers}</h3>
                <p>Utilisateurs</p>
              </div>
            </Link>

            <Link to="/admin/projets" className={styles.statCard}>
              <FiFolder className={styles.icon} />
              <div>
                <h3>{stats.totalProjets}</h3>
                <p>Projets publiés</p>
              </div>
            </Link>

            <Link
              to="/admin/investissements"
              className={`${styles.statCard} ${styles.warning}`}
            >
              <FiDollarSign className={styles.icon} />
              <div>
                <h3>{stats.investissementsEnAttente}</h3>
                <p>
                  À valider <FiAlertCircle />
                </p>
              </div>
            </Link>

            <div className={`${styles.statCard} ${styles.success}`}>
              <FiTrendingUp className={styles.icon} />
              <div>
                <h3>{stats.montantTotalCollecte.toLocaleString()} FCFA</h3>
                <p>Collecté total</p>
              </div>
            </div>
          </div>

          <div className={styles.quickActions}>
            <h2>Actions rapides</h2>
            <div className={styles.actionsGrid}>
              <Link to="/admin/users">Gérer les utilisateurs</Link>
              <Link to="/admin/projets">Voir tous les projets</Link>
              <Link to="/admin/investissements">
                Valider les investissements
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
