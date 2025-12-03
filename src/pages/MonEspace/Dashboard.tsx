// src/pages/UserDashboard/UserDashboard.tsx → DASHBOARD PROPRE & MINIMALISTE
import { Link } from "react-router-dom";
import { useAuth } from "../../components/context/AuthContext";
import { api } from "../../service/api";
import { useEffect, useCallback, useState } from "react";
import styles from "./Dashboard.module.css";
import {
  FiEdit,
  FiMail,
  FiPhone,
  FiMapPin,
  FiDollarSign,
  FiTrendingUp,
  FiPackage,
} from "react-icons/fi";
import type { WalletDTO } from "../../types/wallet";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [wallet, setWallet] = useState<WalletDTO | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);

  const loadWallet = useCallback(async () => {
    try {
      const data = await api.get<WalletDTO>("/api/wallets/solde");
      setWallet(data);
    } catch (err) {
      console.error("Erreur chargement portefeuille");
    } finally {
      setWalletLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadWallet();
  }, [user, loadWallet]);

  if (authLoading || walletLoading) {
    return <div className={styles.loading}>Chargement...</div>;
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
      {/* PROFIL + PORTEFEUILLE */}
      <section className={styles.profileSection}>
        <div className={styles.profileCard}>
          <img
            src={user.image || "/default-avatar.png"}
            alt="Profil"
            className={styles.avatar}
          />

          <div className={styles.info}>
            <h1>
              {user.prenom} {user.nom}
            </h1>
            <p>
              <FiMail /> {user.email}
            </p>
            <p>
              <FiPhone /> {user.contact || "Non renseigné"}
            </p>
            <p>
              <FiMapPin /> {user.localite?.nom || "Non renseigné"}
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
              <FiEdit /> Modifier mon profil
            </Link>
          </div>

          <Link to="/wallet" className={styles.walletBadge}>
            <div className={styles.walletIcon}>
              <FiDollarSign />
            </div>
            <div className={styles.walletLabel}>Portefeuille</div>
            <div className={styles.walletAmount}>
              {wallet?.soldeDisponible?.toFixed(2) || "0.00"} €
            </div>
            <span className={styles.walletLink}>Voir le détail</span>
          </Link>
        </div>
      </section>

      {/* STATS GLOBALES – MINIMALISTE & PUISSANT */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          {/* MES INVESTISSEMENTS */}
          <Link to="/mes-investissements" className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiTrendingUp />
            </div>
            <div className={styles.statContent}>
              <h3>Mes Investissements</h3>
              <div className={styles.statNumber}>
                {user.investissements?.length || 0}
              </div>
              <div className={styles.statDetail}>
                {totalInvesti > 0
                  ? `${totalInvesti.toLocaleString()} € investis`
                  : "Aucun investissement"}
              </div>
            </div>
            <span className={styles.statArrow}>→</span>
          </Link>

          {/* MES PROJETS */}
          <Link to="/mes-projets" className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiPackage />
            </div>
            <div className={styles.statContent}>
              <h3>Mes Projets</h3>
              <div className={styles.statNumber}>
                {user.projets?.length || 0}
              </div>
              <div className={styles.statDetail}>
                {totalCollecte > 0
                  ? `${totalCollecte.toLocaleString()} € collectés`
                  : "Aucun projet"}
              </div>
            </div>
            <span className={styles.statArrow}>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
