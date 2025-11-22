// src/components/Header/Header.tsx → VERSION FINALE ULTIME (19 novembre 2025)
import {
  FiLogIn,
  FiLogOut,
  FiPlusCircle,
  FiUser,
  FiShield,
  FiChevronDown,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Header.module.css";
import { useState } from "react";

export default function Header() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  const isAdmin = user?.roles?.includes("ADMIN") ?? false;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading)
    return (
      <header className={styles.header}>
        <div className={styles.logo}>growzapp</div>
      </header>
    );

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo}>
        <h1>growzapp</h1>
      </Link>

      <nav className={styles.nav}>
        {user ? (
          <>
            <Link to="/projet/creer" className={styles.navLink}>
              <FiPlusCircle /> Créer un projet
            </Link>

            {/* ESPACE ADMIN – VERSION INCASSABLE & ULTRA CONFORTABLE */}
            {isAdmin && (
              <div className={styles.adminDropdown}>
                {/* Le bouton qui ouvre/ferme au clic (plus jamais de problème de souris) */}
                <button
                  onClick={() => setShowAdminMenu((prev) => !prev)}
                  className={styles.adminBtn}
                >
                  <FiShield /> Espace Admin
                  <FiChevronDown
                    className={showAdminMenu ? styles.chevronOpen : ""}
                  />
                </button>

                {/* Le menu – apparaît au clic, reste tant que tu veux */}
                {showAdminMenu && (
                  <>
                    {/* Overlay sombre qui ferme au clic dehors */}
                    <div
                      className={styles.dropdownOverlay}
                      onClick={() => setShowAdminMenu(false)}
                    />

                    {/* Le vrai menu */}
                    <div className={styles.dropdownMenu}>
                      <Link to="/admin" onClick={() => setShowAdminMenu(false)}>
                        Tableau de bord
                      </Link>
                      <Link
                        to="/admin/users"
                        onClick={() => setShowAdminMenu(false)}
                      >
                        Gestion utilisateurs
                      </Link>
                      <Link
                        to="/admin/projets"
                        onClick={() => setShowAdminMenu(false)}
                      >
                        Tous les projets
                      </Link>
                      <Link
                        to="/admin/investissements"
                        onClick={() => setShowAdminMenu(false)}
                      >
                        Investissements à valider
                      </Link>
                    </div>
                  </>
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

            <button onClick={handleLogout} className={styles.logoutBtn}>
              <FiLogOut /> Déconnexion
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
