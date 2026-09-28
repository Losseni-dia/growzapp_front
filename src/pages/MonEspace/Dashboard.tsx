import { Link } from "react-router-dom";
import { useAuth } from "../../components/Context/AuthContext";
import { api } from "../../service/Api";
import { useEffect, useCallback, useState } from "react";
import styles from "./Dashboard.module.css";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../components/Context/CurrencyContext";
import { getAvatarUrl } from "../../types/utils/UserUtils";
import { KycBadge } from "../../components/ui/kycBadge/KycBadge";
import {
  FiEdit,
  FiMail,
  FiPhone,
  FiMapPin,
  FiDollarSign,
  FiTrendingUp,
  FiPackage,
  FiGift,
  FiAlertCircle,
  FiArrowRight,
  FiCompass,
  FiFileText,
  FiFile,
  FiBarChart2,
  FiBriefcase,
  FiUser,
  FiCheckCircle,
  FiDownload,
  FiArrowUpCircle,
  FiRepeat,
  FiShoppingBag,
  FiTruck,
} from "react-icons/fi";
import type { WalletDTO } from "../../types/wallet";
import { ApiResponse } from "../../types/common";

interface DividendeSummary {
  count: number;
  totalPercu: number;
}

export default function Dashboard() {
  const { user, loading: authLoading, reloadUser } = useAuth();
  const { t } = useTranslation();
  const { format } = useCurrency();
  const isInvestisseur = user?.roles?.includes("INVESTISSEUR") ?? false;

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

  // Le webhook VOVE ID ne peut pas atteindre un backend en local, et peut
  // manquer même en production — si le dashboard affiche un KYC toujours
  // "non soumis"/"en attente", on vérifie une fois directement auprès de
  // VOVE ID au chargement plutôt que de rester bloqué sur un statut périmé
  // jusqu'à ce que l'utilisateur relance tout le parcours de vérification.
  useEffect(() => {
    if (user && (user.kycStatus === "NON_SOUMIS" || user.kycStatus === "EN_ATTENTE")) {
      api
        .post("/api/kyc/refresh-status", {})
        .then(() => reloadUser())
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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

  if (authLoading || walletLoading || dividendesLoading || statsLoading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p>{t("dashboard.loading")}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.errorContainer}>
        <FiAlertCircle size={40} />
        <p>{t("dashboard.error_not_identified")}</p>
        <Link to="/login" className={styles.errorLink}>
          {t("dashboard.back_to_login")}
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* ── BANNIÈRE D'ALERTE KYC ── */}
      {(user.kycStatus === "NON_SOUMIS" || user.kycStatus === "REJETE") && (
        <div
          className={`${styles.kycAlert} ${user.kycStatus === "REJETE" ? styles.kycError : ""}`}
        >
          <div className={styles.kycAlertIcon}>
            <FiAlertCircle size={22} />
          </div>
          <div className={styles.kycAlertText}>
            <strong>
              {user.kycStatus === "REJETE"
                ? t("kyc.status_rejected")
                : t("kyc.title")}
            </strong>
            <p>
              {user.kycStatus === "REJETE"
                ? user.kycCommentaireRejet || t("kyc.no_reason_provided")
                : t("kyc.pending_action_hint")}
            </p>
          </div>
          <Link to="/profile/kyc" className={styles.kycAlertBtn}>
            {user.kycStatus === "REJETE"
              ? t("kyc.retry_button")
              : t("kyc.btn_submit")}
            <FiArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* ── HERO PROFIL ── */}
      <section className={styles.hero}>
        <div className={styles.heroIdentity}>
          <div className={styles.avatarWrapper}>
            <img
              src={getAvatarUrl(user.image)}
              alt="Profil"
              className={styles.avatar}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/default-avatar.svg";
              }}
            />
          </div>

          <div className={styles.identityInfo}>
            <div className={styles.nameRow}>
              <h1>
                {user.prenom} {user.nom}
              </h1>
              <KycBadge status={user.kycStatus} />
            </div>

            <div className={styles.contactGrid}>
              <span className={styles.contactItem}>
                <FiMail size={15} /> {user.email}
              </span>
              <span className={styles.contactItem}>
                <FiPhone size={15} /> {user.contact || t("common.not_provided")}
              </span>
              <span className={styles.contactItem}>
                <FiMapPin size={15} />
                {user.localite?.nom || t("common.not_provided")}
                {user.localite?.paysNom && `, ${user.localite.paysNom}`}
              </span>
            </div>

            <div className={styles.roles}>
              {user.roles?.map((role) => (
                <span key={role} className={styles.roleBadge}>
                  {role}
                </span>
              ))}
            </div>
          </div>

          <Link to="/profile/edit" className={styles.editBtn}>
            <FiEdit size={16} /> {t("dashboard.edit_profile")}
          </Link>
        </div>

        <Link to="/wallet" className={styles.walletCard}>
          <div className={styles.walletCardTop}>
            <div className={styles.walletIconCircle}>
              <FiDollarSign size={20} />
            </div>
            <span className={styles.walletLabel}>
              {t("dashboard.wallet.title")}
            </span>
          </div>
          <div className={styles.walletAmount}>
            {format(wallet?.soldeDisponible ?? 0, "XOF")}
          </div>
          <span className={styles.walletLink}>
            {t("dashboard.wallet.view_detail")} <FiArrowRight size={14} />
          </span>
        </Link>
      </section>

      {/* ── STATS ── */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          <Link to="/mes-investissements" className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
              <FiTrendingUp size={22} />
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
            <FiArrowRight className={styles.statArrow} />
          </Link>

          <Link to="/mon-dashboard-porteur" className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconGold}`}>
              <FiPackage size={22} />
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
            <FiArrowRight className={styles.statArrow} />
          </Link>

          <Link to="/mes-dividendes" className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
              <FiGift size={22} />
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
            <FiArrowRight className={styles.statArrow} />
          </Link>
        </div>
      </section>

      {/* ── ACCÈS RAPIDE ── */}
      <section className={styles.quickLinksSection}>
        <h2 className={styles.quickLinksTitle}>{t("dashboard.quick_links")}</h2>

        <div className={styles.quickLinksGroup}>
          <p className={styles.quickLinksGroupTitle}>{t("dashboard.quick_links_group.compte", "Compte")}</p>
          <div className={styles.quickLinksGrid}>
            <Link to="/profile/edit" className={styles.quickLink}>
              <FiUser size={18} />
              <span>{t("user_sidebar.profile", "Mon profil")}</span>
            </Link>
            <Link to="/profile/kyc" className={styles.quickLink}>
              <FiCheckCircle size={18} />
              <span>{t("user_sidebar.kyc", "Vérification d'identité (KYC)")}</span>
            </Link>
          </div>
        </div>

        <div className={styles.quickLinksGroup}>
          <p className={styles.quickLinksGroupTitle}>{t("dashboard.quick_links_group.porteur", "Porteur de projet")}</p>
          <div className={styles.quickLinksGrid}>
            <Link to="/mon-dashboard-porteur" className={styles.quickLink}>
              <FiBriefcase size={18} />
              <span>{t("porteur.title")}</span>
            </Link>
            <Link to="/projet/creer" className={styles.quickLink}>
              <FiPackage size={18} />
              <span>{t("create_project")}</span>
            </Link>
            <Link to="/projets/proximite" className={styles.quickLink}>
              <FiCompass size={18} />
              <span>{t("projets_proches.title")}</span>
            </Link>
          </div>
        </div>

        {isInvestisseur && (
          <div className={styles.quickLinksGroup}>
            <p className={styles.quickLinksGroupTitle}>{t("dashboard.quick_links_group.investisseur", "Investisseur")}</p>
            <div className={styles.quickLinksGrid}>
              <Link to="/mon-portefeuille" className={styles.quickLink}>
                <FiBarChart2 size={18} />
                <span>{t("portfolio.title")}</span>
              </Link>
            </div>
          </div>
        )}

        <div className={styles.quickLinksGroup}>
          <p className={styles.quickLinksGroupTitle}>{t("dashboard.quick_links_group.finance", "Finance")}</p>
          <div className={styles.quickLinksGrid}>
            <Link to="/depot" className={styles.quickLink}>
              <FiDownload size={18} />
              <span>{t("user_sidebar.deposit", "Déposer des fonds")}</span>
            </Link>
            <Link to="/wallet?tab=withdraw" className={styles.quickLink}>
              <FiArrowUpCircle size={18} />
              <span>{t("user_sidebar.withdraw", "Retirer des fonds")}</span>
            </Link>
            <Link to="/wallet?tab=transfer" className={styles.quickLink}>
              <FiRepeat size={18} />
              <span>{t("user_sidebar.transfer", "Transférer des fonds")}</span>
            </Link>
          </div>
        </div>

        <div className={styles.quickLinksGroup}>
          <p className={styles.quickLinksGroupTitle}>{t("dashboard.quick_links_group.growzmarket", "GrowzMarket")}</p>
          <div className={styles.quickLinksGrid}>
            <Link to="/mon-espace/ma-boutique" className={styles.quickLink}>
              <FiShoppingBag size={18} />
              <span>{t("user_sidebar.ma_boutique", "Ma Boutique")}</span>
            </Link>
            <Link to="/mon-espace/mes-ventes-market" className={styles.quickLink}>
              <FiShoppingBag size={18} />
              <span>{t("user_sidebar.mes_ventes_market", "Mes ventes")}</span>
            </Link>
            <Link to="/mon-espace/mes-achats-market" className={styles.quickLink}>
              <FiShoppingBag size={18} />
              <span>{t("user_sidebar.mes_achats_market", "Mes achats")}</span>
            </Link>
          </div>
        </div>

        <div className={styles.quickLinksGroup}>
          <p className={styles.quickLinksGroupTitle}>{t("dashboard.quick_links_group.fournisseur", "Fournisseur")}</p>
          <div className={styles.quickLinksGrid}>
            <Link to="/fournisseurs" className={styles.quickLink}>
              <FiTruck size={18} />
              <span>{t("user_sidebar.fournisseurs", "Trouver un fournisseur")}</span>
            </Link>
            <Link to="/mes-commandes" className={styles.quickLink}>
              <FiShoppingBag size={18} />
              <span>{t("user_sidebar.mes_commandes", "Mes commandes fournisseur")}</span>
            </Link>
            <Link to="/mon-espace/fournisseur" className={styles.quickLink}>
              <FiTruck size={18} />
              <span>{t("user_sidebar.mon_espace_fournisseur", "Mon espace fournisseur")}</span>
            </Link>
          </div>
        </div>

        <div className={styles.quickLinksGroup}>
          <p className={styles.quickLinksGroupTitle}>{t("dashboard.quick_links_group.documents", "Documents")}</p>
          <div className={styles.quickLinksGrid}>
            <Link to="/mes-contrats" className={styles.quickLink}>
              <FiFileText size={18} />
              <span>{t("my_contracts.title")}</span>
            </Link>
            <Link to="/mes-factures" className={styles.quickLink}>
              <FiFile size={18} />
              <span>{t("my_invoices.title")}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
