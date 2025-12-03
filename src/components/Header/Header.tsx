// src/components/Header/Header.tsx

import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Header.module.css";
import {
  FiLogIn,
  FiLogOut,
  FiPlusCircle,
  FiUser,
  FiShield,
  FiChevronDown,
  FiSearch,
} from "react-icons/fi";
import { useState, useEffect } from "react";

export default function Header() {
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isAdmin = user?.roles?.includes("ADMIN") ?? false;

  // Gestion du scroll pour un effet encore plus premium (optionnel mais magnifique)
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fermer le menu admin au clic ailleurs
  useEffect(() => {
    const closeMenu = () => setShowAdminMenu(false);
    if (showAdminMenu) {
      document.addEventListener("click", closeMenu);
      return () => document.removeEventListener("click", closeMenu);
    }
  }, [showAdminMenu]);

  // ON AFFICHE LE HEADER SUR TOUTES LES PAGES (sauf si tu veux l'exclure quelque part)
  if (loading) return null;

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <Link to="/" className={styles.logo}>
        <h1>growzapp</h1>
      </Link>

      <nav className={styles.nav}>
        {user ? (
          <>
            <Link to="/projet/creer" className={styles.navLink}>
              <FiPlusCircle /> <span>Créer un projet</span>
            </Link>
            {/* VÉRIFICATION DE CONTRAT — À AJOUTER ICI */}
            <Link
              to="/verifier-contrat"
              className={`${styles.navLink} ${
                location.pathname.startsWith("/verifier-contrat")
                  ? styles.active
                  : ""
              }`}
            >
              <FiSearch />
              <span>Vérifier un contrat</span>
            </Link>

            {isAdmin && (
              <div className={styles.adminDropdown}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAdminMenu(!showAdminMenu);
                  }}
                  className={styles.adminBtn}
                >
                  <FiShield /> Espace Admin
                  <FiChevronDown
                    className={showAdminMenu ? styles.chevronOpen : ""}
                  />
                </button>

                {showAdminMenu && (
                  <div className={styles.dropdownMenu}>
                    <Link to="/admin" onClick={() => setShowAdminMenu(false)}>
                      Tableau de bord
                    </Link>
                    <Link
                      to="/admin/users"
                      onClick={() => setShowAdminMenu(false)}
                    >
                      Utilisateurs
                    </Link>
                    <Link
                      to="/admin/projets"
                      onClick={() => setShowAdminMenu(false)}
                    >
                      Projets
                    </Link>
                    <Link
                      to="/admin/projetsList"
                      onClick={() => setShowAdminMenu(false)}
                    >
                      Liste des projets
                    </Link>
                    <Link
                      to="/admin/investissements"
                      onClick={() => setShowAdminMenu(false)}
                    >
                      Investissements
                    </Link>
                    <Link
                      to="/admin/project-wallets"
                      onClick={() => setShowAdminMenu(false)}
                    >
                      Trésorerie
                    </Link>
                    <Link
                      to="/admin/retraits"
                      onClick={() => setShowAdminMenu(false)}
                    >
                      Retraits
                    </Link>
                    <Link
                      to="/admin/contrats"
                      onClick={() => setShowAdminMenu(false)}
                    >
                      Contrats
                    </Link>
                  </div>
                )}
              </div>
            )}

            <Link to="/mon-espace" className={styles.monEspaceLink}>
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.prenom}
                  className={styles.userAvatar}
                />
              ) : (
                <div className={styles.defaultAvatar}>
                  <FiUser size={22} />
                </div>
              )}
              <span>{user.prenom}</span>
            </Link>

            <button onClick={logout} className={styles.logoutBtn}>
              <FiLogOut /> <span>Déconnexion</span>
            </button>
          </>
        ) : (
          <Link to="/login" className={styles.loginBtn}>
            <FiLogIn /> Connexion
          </Link>
        )}
      </nav>
    </header>
  );
}