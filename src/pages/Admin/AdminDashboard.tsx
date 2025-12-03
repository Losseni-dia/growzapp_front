// src/pages/admin/DashboardAdmin.tsx
// VERSION FINALE 100% FONCTIONNELLE – 27 NOV 2025

import React, { useEffect, useState } from "react";
import { useAuth } from "../../components/context/AuthContext";
import { api } from "../../service/api";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import styles from "./AdminDashboard.module.css";
import {
  FiUsers,
  FiFolder,
  FiDollarSign,
  FiCreditCard,
  FiTrendingUp,
  FiPackage,
} from "react-icons/fi";

interface Stats {
  totalUsers: number;
  totalProjets: number;
  investissementsEnAttente: number;
  retraitsEnAttente: number;
  montantCollecteSequestre: number;
  montantCollecteAffiche: number;
}

export default function DashboardAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalProjets: 0,
    investissementsEnAttente: 0,
    retraitsEnAttente: 0,
    montantCollecteSequestre: 0,
    montantCollecteAffiche: 0,
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

      const [
        usersRes,
        projetsRes,
        investissementsRes,
        retraitsRes,
        soldeSequestreRes,
        montantAfficheRes,
      ] = await Promise.all([
        api.get<any>("/api/admin/users"),
        api.get<any>("/api/admin/projets"),
        api.get<any>("/api/admin/investissements"),
        api.get<any>("/api/transactions/retraits-en-attente"), // ← tableau direct
        api.get<any>("/api/admin/projet-wallet/solde-total"), // ← BigDecimal brut
        api.get<any>("/api/admin/projet-wallet/montant-total-collecte"),
      ]);

      const enAttenteInvest =
        investissementsRes?.data?.filter(
          (i: any) => i.statutPartInvestissement === "EN_ATTENTE"
        )?.length || 0;

      setStats({
        totalUsers: usersRes?.data?.length || 0,
        totalProjets: projetsRes?.data?.length || 0,
        investissementsEnAttente: enAttenteInvest,
        retraitsEnAttente: Array.isArray(retraitsRes)
          ? retraitsRes.length
          : retraitsRes?.data?.length || 0,
        montantCollecteSequestre: Number(soldeSequestreRes) || 0,
        montantCollecteAffiche: Number(montantAfficheRes) || 0,
      });
    } catch (err: any) {
      console.error("Erreur chargement stats admin", err);
      toast.error("Impossible de charger les statistiques");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className={styles.container}>
      <h1 className={styles.mainTitle}>Espace Administrateur</h1>

      {loading ? (
        <p className={styles.loading}>Chargement des statistiques...</p>
      ) : (
        <>
          <div className={styles.statsGrid}>
            <Link to="/admin/users" className={styles.statCard}>
              <FiUsers className={styles.icon} />
              <div>
                <h3>{stats.totalUsers.toLocaleString()}</h3>
                <p>Utilisateurs inscrits</p>
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
                <p>Investissements en attente</p>
              </div>
            </Link>

            <Link
              to="/admin/retraits"
              className={`${styles.statCard} ${
                stats.retraitsEnAttente > 0 ? styles.danger : styles.success
              }`}
            >
              <FiCreditCard className={styles.icon} />
              <div>
                <h3>{stats.retraitsEnAttente}</h3>
                <p>Retraits en attente</p>
              </div>
            </Link>

            <Link
              to="/admin/project-wallets"
              className={`${styles.statCard} ${styles.tresorerie}`}
            >
              <FiPackage className={styles.icon} />
              <div>
                <h3>
                  {stats.montantCollecteSequestre.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  €
                </h3>
                <p>Trésorerie séquestrée (réelle)</p>
              </div>
            </Link>

            <div className={`${styles.statCard} ${styles.success}`}>
              <FiTrendingUp className={styles.icon} />
              <div>
                <h3>
                  {stats.montantCollecteAffiche.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  €
                </h3>
                <p>Montant affiché aux investisseurs</p>
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
              <Link to="/admin/retraits" className={styles.highlightLink}>
                Valider les retraits ({stats.retraitsEnAttente})
              </Link>
              <Link
                to="/admin/project-wallets"
                className={styles.highlightLink}
              >
                Gérer la trésorerie séquestrée
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
