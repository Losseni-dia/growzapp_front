import { Link } from "react-router-dom";

import { useAuth } from "../../components/Context/AuthContext";

import { api } from "../../service/Api";

import { useEffect, useCallback, useState } from "react";

import styles from "./Dashboard.module.css";

import { useTranslation } from "react-i18next";

import { useCurrency } from "../../components/Context/CurrencyContext";

import { getAvatarUrl } from "../../types/utils/UserUtils";

import { KycBadge } from "../../components/ui/kycBadge/KycBadge"; // <-- IMPORT DU BADGE

import {
  FiEdit,
  FiMail,
  FiPhone,
  FiMapPin,
  FiDollarSign,
  FiTrendingUp,
  FiPackage,
  FiGift,
  FiAlertCircle, // Icône pour l'alerte KYC
} from "react-icons/fi";

import type { WalletDTO } from "../../types/wallet";

import { ApiResponse } from "../../types/common";

interface DividendeSummary {
  count: number;

  totalPercu: number;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();

  const { t } = useTranslation();

  const { format } = useCurrency();

  const [wallet, setWallet] = useState<WalletDTO | null>(null);

  const [walletLoading, setWalletLoading] = useState(true);

  const [stats, setStats] = useState({
    invCount: 0,
    projCount: 0,
    totalInvesti: 0,
    totalCollecte: 0,
  });

  const [statsLoading, setStatsLoading] = useState(true);

  const [dividendesSummary, setDividendesSummary] = useState<DividendeSummary>({
    count: 0,

    totalPercu: 0,
  });

  const [dividendesLoading, setDividendesLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWalletLoading(false);
      setStatsLoading(false);
      setDividendesLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const loadWallet = useCallback(async () => {
    try {
      const data = await api.get<WalletDTO>("/api/wallets/solde");

      setWallet(data);
    } catch (err) {
      console.error("Erreur chargement portefeuille", err);
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);

      const [invRes, projRes] = await Promise.all([
        api.get<any>("/api/investissements/mes-investissements"),

        api.get<any>("/api/projets/mes-projets"),
      ]);

      const invs = invRes?.data || [];

      const projs = projRes?.data || [];

      const tInvesti = invs.reduce(
        (sum: number, i: any) => sum + Number(i.montantInvesti || 0),
        0,
      );

      const tCollecte = projs.reduce(
        (sum: number, p: any) => sum + Number(p.montantCollecte || 0),
        0,
      );

      setStats({
        invCount: invs.length,

        projCount: projs.length,

        totalInvesti: tInvesti,

        totalCollecte: tCollecte,
      });
    } catch (err) {
      console.error("Erreur stats", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadDividendesSummary = useCallback(async () => {
    try {
      setDividendesLoading(true);

      const response = await api.get<ApiResponse<any[]>>(
        "/api/dividendes/mes-dividendes",
      );

      const dividendes = response.data || [];

      const payes = dividendes.filter((d: any) => d.statutDividende === "PAYE");

      const totalPercu = payes.reduce(
        (sum: number, d: any) => sum + Number(d.montantTotal || 0),
        0,
      );

      setDividendesSummary({ count: dividendes.length, totalPercu });
    } catch (err) {
      console.error("Erreur chargement dividendes", err);
    } finally {
      setDividendesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadWallet();

      loadStats();

      loadDividendesSummary();
    }
  }, [user, loadWallet, loadStats, loadDividendesSummary]);

  // 1. Sécurité Chargement : On s'assure que le loader s'arrête quoi qu'il arrive
  if (authLoading || walletLoading || dividendesLoading || statsLoading) {
    return <div className={styles.loading}>{t("dashboard.loading")}</div>;
  }

  // SÉCURITÉ 2 : Si pas d'utilisateur, on affiche un message d'erreur plutôt qu'un crash
  if (!user) {
    return (
      <div className={styles.errorContainer}>
        <p>Utilisateur non identifié. Veuillez vous reconnecter.</p>
        <Link to="/login">Retour à la connexion</Link>
      </div>
    );
  }


  return (
    <div className={styles.container}>
      {/* 1. BANNIÈRE D'ALERTE KYC (Si rejeté ou non soumis) */}

      {(user.kycStatus === "NON_SOUMIS" || user.kycStatus === "REJETE") && (
        <div
          className={`${styles.kycAlert} ${user.kycStatus === "REJETE" ? styles.kycError : ""}`}
        >
          <FiAlertCircle size={24} />

          <div className={styles.kycAlertText}>
            <strong>
              {user.kycStatus === "REJETE"
                ? t("kyc.status_rejected")
                : t("kyc.title")}
            </strong>

            <p>
              {user.kycStatus === "REJETE"
                ? user.kycCommentaireRejet || t("kyc.no_reason_provided")
                : t("kyc.pending_action_hint") ||
                  "Veuillez vérifier votre identité pour débloquer toutes les fonctionnalités."}
            </p>
          </div>

          <Link to="/profile/kyc" className={styles.kycAlertBtn}>
            {user.kycStatus === "REJETE"
              ? t("kyc.retry_button")
              : t("kyc.btn_submit")}
          </Link>
        </div>
      )}

      <section className={styles.profileSection}>
        <div className={styles.profileCard}>
          <img
            src={getAvatarUrl(user.image)}
            alt="Profil"
            className={styles.avatar}
            onError={(e) => (e.currentTarget.src = "/default-avatar.png")}
          />

          <div className={styles.info}>
            <div className={styles.nameRow}>
              <h1>
                {user.prenom} {user.nom}
              </h1>

              <KycBadge status={user.kycStatus} />
            </div>

            <p>
              <FiMail /> {user.email}
            </p>

            <p>
              <FiPhone /> {user.contact || t("common.not_provided")}
            </p>

            <p>
              <FiMapPin /> {user.localite?.nom || t("common.not_provided")}
              {user.localite?.paysNom && `, ${user.localite.paysNom}`}
            </p>

            <div className={styles.roles}>
              {user.roles?.map((role) => (
                <span key={role} className={styles.roleBadge}>
                  {role}
                </span>
              ))}
            </div>

            <Link to="/profile/edit" className={styles.editBtn}>
              <FiEdit /> {t("dashboard.edit_profile")}
            </Link>
          </div>

          <Link to="/wallet" className={styles.walletBadge}>
            <div className={styles.walletIcon}>
              <FiDollarSign />
            </div>

            <div className={styles.walletLabel}>
              {t("dashboard.wallet.title")}
            </div>

            <div className={styles.walletAmount}>
              {format(wallet?.soldeDisponible ?? 0, "XOF")}
            </div>

            <span className={styles.walletLink}>
              {t("dashboard.wallet.view_detail")}
            </span>
          </Link>
        </div>
      </section>

      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          {/* CARTE INVESTISSEMENTS */}

          <Link to="/mes-investissements" className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiTrendingUp />
            </div>

            <div className={styles.statContent}>
              <h3>{t("dashboard.stats.my_investments")}</h3>

              <div className={styles.statNumber}>{stats.invCount}</div>

              <div className={styles.statDetail}>
                {stats.totalInvesti > 0
                  ? `${format(stats.totalInvesti, "XOF")} ${t("dashboard.stats.invested")}`
                  : t("dashboard.stats.none_invested")}
              </div>
            </div>

            <span className={styles.statArrow}>→</span>
          </Link>

          {/* CARTE PROJETS */}

          <Link to="/mes-projets" className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiPackage />
            </div>

            <div className={styles.statContent}>
              <h3>{t("dashboard.stats.my_projects")}</h3>

              <div className={styles.statNumber}>{stats.projCount}</div>

              <div className={styles.statDetail}>
                {stats.totalCollecte > 0
                  ? `${format(stats.totalCollecte, "XOF")} ${t("dashboard.stats.collected")}`
                  : t("dashboard.stats.none_projects")}
              </div>
            </div>

            <span className={styles.statArrow}>→</span>
          </Link>

          {/* CARTE DIVIDENDES */}

          <Link to="/mes-dividendes" className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiGift style={{ color: "#27ae60" }} />
            </div>

            <div className={styles.statContent}>
              <h3>{t("dashboard.stats.my_dividends")}</h3>

              <div className={styles.statNumber}>{dividendesSummary.count}</div>

              <div className={styles.statDetail}>
                {dividendesSummary.totalPercu > 0
                  ? `${format(dividendesSummary.totalPercu, "XOF")} ${t("dashboard.stats.received")}`
                  : t("dashboard.stats.none_received")}
              </div>
            </div>

            <span className={styles.statArrow}>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
