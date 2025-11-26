// src/pages/Dashboard/Dashboard.tsx → VERSION FINALE ULTIME — 26 NOV 2025
import React, { useEffect, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../components/context/AuthContext";
import { api } from "../../service/api";
import styles from "./Dashboard.module.css";
import {
  FiEdit,
  FiMail,
  FiPhone,
  FiMapPin,
  FiEye,
  FiDollarSign,
} from "react-icons/fi";

import type { WalletDTO } from "../../types/wallet";

export default function Dashboard() {
  const { user, updateUser, loading: authLoading } = useAuth();
  const [wallet, setWallet] = useState<WalletDTO | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);

  const loadFullProfile = useCallback(async () => {
    try {
      const response = await api.get<any>("users/me");
      if (response.success && response.data) {
        updateUser(response.data);
      }
    } catch (err: any) {
      if (err.message.includes("401")) {
        console.error("Token expiré → déconnexion");
      } else {
        console.error("Erreur chargement profil :", err);
      }
    }
  }, [updateUser]);

  // Chargement du wallet séparé — PROPRE ET EFFICACE
  const loadWallet = useCallback(async () => {
    try {
      const walletData = await api.get<WalletDTO>("/api/wallets/solde");
      setWallet(walletData);
    } catch (err) {
      console.error("Erreur chargement du portefeuille");
    } finally {
      setWalletLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFullProfile();
    loadWallet();
  }, [loadFullProfile, loadWallet]);

  if (authLoading || walletLoading) {
    return <div className={styles.loading}>Chargement du profil...</div>;
  }

  if (!user) {
    return <div className={styles.loading}>Connexion requise</div>;
  }

  const investments = user.investissements ?? [];
  const projects = user.projets ?? [];

  return (
    <div className={styles.container}>
      {/* SECTION PROFIL + PORTEFEUILLE EN HAUT À DROITE */}
      <section className={styles.profileSection}>
        <div className={styles.profileCard}>
          {/* Avatar */}
          <img
            src={user.image || "/default-avatar.png"}
            alt="Profil"
            className={styles.avatar}
          />

          {/* Infos personnelles */}
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

            {/* BOUTON MODIFIER PROFIL — JAUNE #e2b607, MAGNIFIQUE */}
            <Link to="/profile/edit" className={styles.editBtn}>
              <FiEdit size={20} />
              Modifier mon profil
            </Link>
          </div>

          {/* BADGE PORTEFEUILLE — ORANGE DOUX, TEXTE BLANC, SOLDE DISPONIBLE */}
          <Link to="/wallet" className={styles.walletBadge}>
            <div className={styles.walletIcon}>
              <FiDollarSign size={32} />
            </div>
            <div className={styles.walletLabel}>Mon Portefeuille</div>
            <div className={styles.walletAmount}>
              {wallet?.soldeDisponible?.toFixed(2) || "0.00"} €
            </div>
            <span className={styles.walletLink}>Voir le détail</span>
          </Link>
        </div>
      </section>

      {/* MES INVESTISSEMENTS */}
      <section className={styles.section}>
        <h2>Mes investissements ({investments.length})</h2>
        {investments.length === 0 ? (
          <p className={styles.empty}>
            Vous n'avez pas encore investi.{" "}
            <Link to="/projets">Découvrir les projets</Link>
          </p>
        ) : (
          <div className={styles.grid}>
            {investments.map((inv) => (
              <div key={inv.id} className={styles.card}>
                <h3>{inv.projetLibelle}</h3>
                <p>
                  <strong>{inv.nombrePartsPris}</strong> parts •{" "}
                  {(inv.nombrePartsPris * inv.prixUnePart).toLocaleString()} €
                </p>
                <Link to={`/projet/${inv.projetId}`} className={styles.btn}>
                  <FiEye size={18} /> Voir
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MES PROJETS */}
      <section className={styles.section}>
        <h2>Mes projets ({projects.length})</h2>
        {projects.length === 0 ? (
          <p className={styles.empty}>
            Vous n'avez pas encore de projet.
            {(user.roles?.includes("PORTEUR") ||
              user.roles?.includes("ADMIN")) && (
              <Link to="/projet/creer">Créer un projet</Link>
            )}
          </p>
        ) : (
          <div className={styles.grid}>
            {projects.map((p) => (
              <div key={p.id} className={styles.card}>
                {p.poster && (
                  <img
                    src={p.poster}
                    alt={p.libelle}
                    className={styles.poster}
                  />
                )}
                <h3>{p.libelle}</h3>
                <p>
                  <strong>{p.montantCollecte?.toLocaleString() ?? 0} €</strong>{" "}
                  / {p.objectifFinancement?.toLocaleString() ?? 0} €
                  <progress
                    value={p.montantCollecte ?? 0}
                    max={p.objectifFinancement ?? 1}
                    className={styles.progress}
                  />
                </p>
                <Link to={`/projet/${p.id}`} className={styles.btn}>
                  <FiEye size={18} /> Voir
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
