// src/pages/Admin/AdminDashboard.tsx

import React, { useEffect, useState } from "react";
import { useAuth } from "../../components/context/AuthContext";
import { api } from "../../service/api";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../components/context/CurrencyContext"; // <--- IMPORT DU CONTEXT

// IMPORTS CSS
import styles from "./AdminDashboard.module.css";
import stylesProjets from "./Projets/AdminProjetsList.module.css";

import {
  FiUsers,
  FiFolder,
  FiDollarSign,
  FiCreditCard,
  FiTrendingUp,
  FiPackage,
  FiEdit,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiTrash2,
  FiFileText,
} from "react-icons/fi";

// --- INTERFACES ---
interface Stats {
  totalUsers: number;
  totalProjets: number;
  totalContrats: number;
  investissementsEnAttente: number;
  retraitsEnAttente: number;
  montantCollecteSequestre: number;
  montantCollecteAffiche: number;
}

interface ProjetAdmin {
  id: number;
  libelle: string;
  statutProjet: string;
  porteurPrenom?: string;
  porteurNom: string;
  poster?: string;
  montantCollecte: number;
  objectifFinancement: number;
}

export default function DashboardAdmin() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { format } = useCurrency(); // <--- HOOK MONNAIE
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // --- ÉTATS ---
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalProjets: 0,
    totalContrats: 0,
    investissementsEnAttente: 0,
    retraitsEnAttente: 0,
    montantCollecteSequestre: 0,
    montantCollecteAffiche: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const isAdmin = user?.roles?.includes("ADMIN") ?? false;

  // --- 1. CHARGEMENT DES PROJETS ---
  const { data: projetsData, isLoading: loadingProjets } = useQuery({
    queryKey: ["admin-projets"],
    queryFn: () => api.get<{ data: ProjetAdmin[] }>("/api/admin/projets"),
    enabled: isAdmin,
  });

  const projets = projetsData?.data || [];

  // --- 2. CHARGEMENT DES STATS ---
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
      setLoadingStats(true);
      const [
        usersRes,
        investissementsRes,
        retraitsRes,
        contratsRes,
        soldeSequestreRes,
        montantAfficheRes,
      ] = await Promise.all([
        api.get<any>("/api/admin/users"),
        api.get<any>("/api/admin/investissements"),
        api.get<any>("/api/transactions/retraits-en-attente"),
        api.get<any>("/api/contrats/admin/liste?page=0&size=1"),
        api.get<any>("/api/admin/projet-wallet/solde-total"),
        api.get<any>("/api/admin/projet-wallet/montant-total-collecte"),
      ]);

      let totalContratsCount = 0;
      if (contratsRes) {
        if (typeof contratsRes.totalContrats === "number")
          totalContratsCount = contratsRes.totalContrats;
        else if (typeof contratsRes.totalElements === "number")
          totalContratsCount = contratsRes.totalElements;
      }

      const enAttenteInvest =
        investissementsRes?.data?.filter(
          (i: any) => i.statutPartInvestissement === "EN_ATTENTE"
        )?.length || 0;

      setStats({
        totalUsers: usersRes?.data?.length || 0,
        totalProjets: projets.length,
        totalContrats: totalContratsCount,
        investissementsEnAttente: enAttenteInvest,
        retraitsEnAttente: Array.isArray(retraitsRes)
          ? retraitsRes.length
          : retraitsRes?.data?.length || 0,
        montantCollecteSequestre: Number(soldeSequestreRes) || 0,
        montantCollecteAffiche: Number(montantAfficheRes) || 0,
      });
    } catch (err: any) {
      console.error("Erreur stats", err);
    } finally {
      setLoadingStats(false);
    }
  };

  // --- MUTATIONS (Garder les mêmes) ---
  const validerMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/api/admin/projets/${id}/valider`),
    onSuccess: () => {
      toast.success(t("admin.withdrawals.toast.validate_success"));
      queryClient.invalidateQueries({ queryKey: ["admin-projets"] });
    },
  });

  const rejeterMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/api/admin/projets/${id}/rejeter`),
    onSuccess: () => {
      toast.success(t("admin.withdrawals.toast.reject_success"));
      queryClient.invalidateQueries({ queryKey: ["admin-projets"] });
    },
  });

  const supprimerMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/projets/${id}`),
    onSuccess: () => {
      toast.success(t("admin.roles.success"));
      queryClient.invalidateQueries({ queryKey: ["admin-projets"] });
    },
  });

  const handleSupprimer = (id: number, libelle: string) => {
    if (window.confirm(t("admin.projects.confirm_delete", { name: libelle }))) {
      supprimerMutation.mutate(id);
    }
  };

  if (!isAdmin) return null;
  const isLoading = loadingStats || loadingProjets;

  return (
    <div className={styles.container}>
      <h1 className={styles.mainTitle}>{t("admin.dashboard.title")}</h1>

      {isLoading ? (
        <p className={styles.loading}>{t("dashboard.loading")}</p>
      ) : (
        <>
          <div className={styles.statsGrid}>
            <Link to="/admin/users" className={styles.statCard}>
              <FiUsers className={styles.icon} />
              <div>
                <h3>{stats.totalUsers.toLocaleString(i18n.language)}</h3>
                <p>{t("admin.dashboard.users")}</p>
              </div>
            </Link>

            <div className={styles.statCard}>
              <FiFolder className={styles.icon} />
              <div>
                <h3>{projets.length}</h3>
                <p>{t("admin.dashboard.projects")}</p>
              </div>
            </div>

            <Link to="/admin/contrats" className={styles.statCard}>
              <FiFileText className={styles.icon} />
              <div>
                <h3>{stats.totalContrats.toLocaleString(i18n.language)}</h3>
                <p>{t("admin.dashboard.contracts")}</p>
              </div>
            </Link>

            <Link
              to="/admin/investissements"
              className={`${styles.statCard} ${styles.warning}`}
            >
              <FiDollarSign className={styles.icon} />
              <div>
                <h3>{stats.investissementsEnAttente}</h3>
                <p>{t("admin.dashboard.investments_pending")}</p>
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
                <p>{t("admin.dashboard.withdrawals_pending")}</p>
              </div>
            </Link>

            <Link
              to="/admin/project-wallets"
              className={`${styles.statCard} ${styles.tresorerie}`}
            >
              <FiPackage className={styles.icon} />
              <div>
                {/* CONVERSION MONTANT SEQUESTRE */}
                <h3>{format(stats.montantCollecteSequestre, "XOF")}</h3>
                <p>{t("admin.dashboard.real_escrow")}</p>
              </div>
            </Link>

            <div className={`${styles.statCard} ${styles.success}`}>
              <FiTrendingUp className={styles.icon} />
              <div>
                {/* CONVERSION MONTANT AFFICHE */}
                <h3>{format(stats.montantCollecteAffiche, "XOF")}</h3>
                <p>{t("admin.dashboard.displayed_amount")}</p>
              </div>
            </div>
          </div>

          <div className={styles.quickActions}>
            <h2>{t("admin.dashboard.quick_actions")}</h2>
            <div className={styles.actionsGrid}>
              <Link to="/admin/users">{t("admin.dashboard.manage_users")}</Link>
              <Link to="/admin/projets">
                {t("admin.dashboard.see_projects")}
              </Link>
              <Link to="/admin/investissements">
                {t("admin.dashboard.validate_investments")}
              </Link>
              <Link to="/admin/retraits" className={styles.highlightLink}>
                {t("admin.dashboard.validate_withdrawals")} (
                {stats.retraitsEnAttente})
              </Link>
              <Link
                to="/admin/project-wallets"
                className={styles.highlightLink}
              >
                {t("admin.dashboard.manage_escrow")}
              </Link>
            </div>
          </div>

          <div className={styles.divider} />

          <h2
            style={{
              marginTop: "4rem",
              fontSize: "2rem",
              color: "#1b5e20",
              textAlign: "center",
            }}
          >
            {t("admin.projects.title", { count: projets.length })}
          </h2>

          <div className={stylesProjets.grid}>
            {projets.map((p) => {
              const progression =
                p.objectifFinancement > 0
                  ? (p.montantCollecte / p.objectifFinancement) * 100
                  : 0;
              return (
                <div key={p.id} className={stylesProjets.card}>
                  <div className={stylesProjets.posterWrapper}>
                    {p.poster ? (
                      <img
                        src={p.poster}
                        alt={p.libelle}
                        className={stylesProjets.poster}
                      />
                    ) : (
                      <div className={stylesProjets.noPoster}>
                        {t("admin.projects.no_poster")}
                      </div>
                    )}
                    <div
                      className={`${stylesProjets.statutBadge} ${
                        stylesProjets[p.statutProjet?.toLowerCase()] ||
                        stylesProjets.badgeDefault
                      }`}
                    >
                      {p.statutProjet}
                    </div>
                  </div>

                  <div className={stylesProjets.content}>
                    <h3 className={stylesProjets.projectTitle}>{p.libelle}</h3>
                    <p className={stylesProjets.porteur}>
                      {t("admin.projects.by")} {p.porteurPrenom || ""}{" "}
                      {p.porteurNom}
                    </p>

                    <div className={stylesProjets.progress}>
                      <div className={stylesProjets.progressBar}>
                        <div
                          className={stylesProjets.progressFill}
                          style={{ width: `${progression}%` }}
                        />
                      </div>
                      <span>{progression.toFixed(0)}%</span>
                    </div>

                    {/* MONTANTS PROJETS CONVERTIS */}
                    <div
                      style={{
                        fontSize: "0.9rem",
                        marginBottom: "1rem",
                        color: "#666",
                      }}
                    >
                      {format(p.montantCollecte, "XOF")} /{" "}
                      {format(p.objectifFinancement, "XOF")}
                    </div>

                    <div className={stylesProjets.actions}>
                      <Link
                        to={`/admin/projets/detail/${p.id}`}
                        className={stylesProjets.btnDetail}
                      >
                        <FiEye /> {t("admin.projects.btn_docs")}
                      </Link>
                      <Link
                        to={`/admin/projets/edit/${p.id}`}
                        className={stylesProjets.btnEdit}
                      >
                        <FiEdit /> {t("admin.projects.btn_edit")}
                      </Link>
                      <button
                        onClick={() => handleSupprimer(p.id, p.libelle)}
                        className={stylesProjets.btnDelete}
                        disabled={supprimerMutation.isPending}
                      >
                        <FiTrash2 /> {t("admin.projects.btn_delete")}
                      </button>
                    </div>

                    {(p.statutProjet === "SOUMIS" ||
                      p.statutProjet === "EN_ATTENTE") && (
                      <div className={stylesProjets.statusActions}>
                        <button
                          onClick={() => validerMutation.mutate(p.id)}
                          className={stylesProjets.btnValider}
                          disabled={validerMutation.isPending}
                        >
                          <FiCheckCircle /> {t("admin.projects.btn_validate")}
                        </button>
                        <button
                          onClick={() => rejeterMutation.mutate(p.id)}
                          className={stylesProjets.btnRejeter}
                          disabled={rejeterMutation.isPending}
                        >
                          <FiXCircle /> {t("admin.projects.btn_reject")}
                        </button>
                      </div>
                    )}
                    <Link
                      to={`/projet/${p.id}`}
                      target="_blank"
                      className={stylesProjets.btnPublic}
                    >
                      {t("admin.projects.btn_public")}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
