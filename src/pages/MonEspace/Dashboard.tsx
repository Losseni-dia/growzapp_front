import { Link } from "react-router-dom";
import { useAuth } from "../../components/context/AuthContext";
import { api } from "../../service/api";
import { useEffect, useCallback, useState } from "react";
import styles from "./Dashboard.module.css";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../components/context/CurrencyContext";
import { getAvatarUrl } from "../../types/utils/UserUtils"; // <-- IMPORT DE L'UTILITAIRE
import {
  FiEdit,
  FiMail,
  FiPhone,
  FiMapPin,
  FiDollarSign,
  FiTrendingUp,
  FiPackage,
  FiGift,
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
  const [dividendesSummary, setDividendesSummary] = useState<DividendeSummary>({
    count: 0,
    totalPercu: 0,
  });
  const [dividendesLoading, setDividendesLoading] = useState(true);

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

  const loadDividendesSummary = useCallback(async () => {
    try {
      setDividendesLoading(true);
      const response = await api.get<ApiResponse<any[]>>(
        "/api/dividendes/mes-dividendes"
      );
      const dividendes = response.data || [];
      const payes = dividendes.filter((d: any) => d.statutDividende === "PAYE");
      const totalPercu = payes.reduce(
        (sum: number, d: any) => sum + Number(d.montantTotal || 0),
        0
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
      loadDividendesSummary();
    }
  }, [user, loadWallet, loadDividendesSummary]);

  if (authLoading || walletLoading || dividendesLoading) {
    return <div className={styles.loading}>{t("dashboard.loading")}</div>;
  }

  if (!user) return null;

  const totalInvesti = (user.investissements ?? []).reduce(
    (sum, inv) =>
      sum + (inv.montantInvesti ?? inv.nombrePartsPris * inv.prixUnePart),
    0
  );

  const totalCollecte = (user.projets ?? []).reduce(
    (sum, p) => sum + (p.montantCollecte ?? 0),
    0
  );

  return (
    <div className={styles.container}>
      <section className={styles.profileSection}>
        <div className={styles.profileCard}>
          <img
            src={getAvatarUrl(user.image)} // <-- UTILISATION DE L'UTILITAIRE
            alt="Profil"
            className={styles.avatar}
            onError={(e) => (e.currentTarget.src = "/default-avatar.png")}
          />

          <div className={styles.info}>
            <h1>
              {user.prenom} {user.nom}
            </h1>
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
          <Link to="/mes-investissements" className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiTrendingUp />
            </div>
            <div className={styles.statContent}>
              <h3>{t("dashboard.stats.my_investments")}</h3>
              <div className={styles.statNumber}>
                {user.investissements?.length || 0}
              </div>
              <div className={styles.statDetail}>
                {totalInvesti > 0
                  ? `${format(totalInvesti, "XOF")} ${t(
                      "dashboard.stats.invested"
                    )}`
                  : t("dashboard.stats.none_invested")}
              </div>
            </div>
            <span className={styles.statArrow}>→</span>
          </Link>

          <Link to="/mes-projets" className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiPackage />
            </div>
            <div className={styles.statContent}>
              <h3>{t("dashboard.stats.my_projects")}</h3>
              <div className={styles.statNumber}>
                {user.projets?.length || 0}
              </div>
              <div className={styles.statDetail}>
                {totalCollecte > 0
                  ? `${format(totalCollecte, "XOF")} ${t(
                      "dashboard.stats.collected"
                    )}`
                  : t("dashboard.stats.none_projects")}
              </div>
            </div>
            <span className={styles.statArrow}>→</span>
          </Link>

          <Link to="/mes-dividendes" className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiGift style={{ color: "#27ae60" }} />
            </div>
            <div className={styles.statContent}>
              <h3>{t("dashboard.stats.my_dividends")}</h3>
              <div className={styles.statNumber}>{dividendesSummary.count}</div>
              <div className={styles.statDetail}>
                {dividendesSummary.totalPercu > 0
                  ? `${format(dividendesSummary.totalPercu, "XOF")} ${t(
                      "dashboard.stats.received"
                    )}`
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
