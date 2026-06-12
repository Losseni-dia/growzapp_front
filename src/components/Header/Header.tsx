import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiChevronDown,
  FiDollarSign,
  FiGlobe,
  FiLayout,
  FiLogIn,
  FiLogOut,
  FiMapPin,
  FiPackage,
  FiPlusCircle,
  FiSearch,
  FiSettings,
  FiShield,
  FiUser
} from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAvatarUrl } from "../../types/utils/UserUtils";
import { useAuth } from "../Context/AuthContext";
import { useCurrency } from "../Context/CurrencyContext";
import styles from "./Header.module.css";

// IMPORT DU COMPOSANT CLOCHE
import NotificationBell from "../../pages/notification/notificationBell/NotificationBell";

export default function Header() {
  const { user, logout, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { currency, setCurrency, rates } = useCurrency();

  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const adminRef = useRef<HTMLDivElement>(null);

  const isAdmin = useMemo(
    () => user?.roles?.includes("ADMIN") ?? false,
    [user],
  );
  const availableCurrencies = useMemo(() => Object.keys(rates), [rates]);

  const toggleLanguage = () => {
    const langs = ["fr", "en", "es"];
    const nextLang = langs[(langs.indexOf(i18n.language) + 1) % langs.length];
    i18n.changeLanguage(nextLang);
    localStorage.setItem("i18nextLng", nextLang);
  };

  const toggleCurrency = () => {
    const nextCurr =
      availableCurrencies[
        (availableCurrencies.indexOf(currency) + 1) % availableCurrencies.length
      ];
    setCurrency(nextCurr);
  };

  const handleLogout = () => {
    if (
      window.confirm(t("confirm_logout") || "Voulez-vous vous déconnecter ?")
    ) {
      logout();
      navigate("/login");
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (adminRef.current && !adminRef.current.contains(e.target as Node))
        setShowAdminMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (authLoading) return null;

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <Link to="/" className={styles.logo}>
        <img
          src="/logo.svg"
          alt="Growzapp"
          style={{
            height: "40px",
            width: "auto",
          }}
        />
      </Link>

      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          {user && (
            <>
              <Link to="/projet/creer" className={styles.navLink}>
                <FiPlusCircle /> <span>{t("create_project")}</span>
              </Link>
              <Link
                to="/projets/proximite"
                className={`${styles.navLink} ${styles.proximityLink}`}
              >
                <FiMapPin />
                <span>Autour de moi</span>
              </Link>
              <Link
                to="/verifier-contrat"
                className={`${styles.navLink} ${location.pathname.startsWith("/verifier-contrat") ? styles.active : ""}`}
              >
                <FiSearch /> <span>{t("link_verify_contract")}</span>
              </Link>
              <Link to="/news" className={styles.navLink}>
                Actualités
              </Link>

              {isAdmin && (
                <div className={styles.adminWrapper} ref={adminRef}>
                  <button
                    onClick={() => setShowAdminMenu(!showAdminMenu)}
                    className={`${styles.adminBtn} ${showAdminMenu ? styles.active : ""}`}
                  >
                    <FiShield /> <span>{t("admin_space")}</span>{" "}
                    <FiChevronDown />
                  </button>
                  {showAdminMenu && (
                    <div className={styles.adminMenu}>
                      <Link to="/admin" onClick={() => setShowAdminMenu(false)}>
                        <FiLayout /> {t("admin.dashboard.title")}
                      </Link>
                      <Link
                        to="/admin/settings"
                        onClick={() => setShowAdminMenu(false)}
                      >
                        <FiSettings />{" "}
                        {t("admin.projects.project_config") || "Config Projets"}
                      </Link>
                      <Link
                        to="/admin/kyc"
                        onClick={() => setShowAdminMenu(false)}
                      >
                        <FiShield /> Validation KYC
                      </Link>
                      <Link
                        to="/admin/users"
                        onClick={() => setShowAdminMenu(false)}
                      >
                        <FiUser /> Gestion Users
                      </Link>
                      <div className={styles.divider}></div>
                      <Link
                        to="/admin/projets"
                        onClick={() => setShowAdminMenu(false)}
                      >
                        <FiPackage /> Voir Projets
                      </Link>
                      <Link
                        to="/admin/project-wallets"
                        onClick={() => setShowAdminMenu(false)}
                      >
                        <FiDollarSign />{" "}
                        {t("admin.wallets.title") || "Wallets Projets"}
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className={styles.rightSection}>
          <div className={styles.userSection}>
            {/* --- SECTIONS RÉSERVÉES AUX CONNECTÉS --- */}
            {user && (
              <>
                {/* LA CLOCHE ICI */}
                <NotificationBell />

                <Link to="/mon-espace" className={styles.monEspaceLink}>
                  <img
                    src={getAvatarUrl(user.image)}
                    alt={user.prenom}
                    className={styles.userAvatar}
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/default-avatar.svg"; }}
                  />
                  <span className={styles.userName}>{user.prenom}</span>
                </Link>
              </>
            )}

            {/* --- SELECTEURS TOUJOURS VISIBLES --- */}
            <button
              onClick={toggleCurrency}
              className={styles.directActionBtn}
              title="Changer Devise"
            >
              <FiDollarSign />{" "}
              <span className={styles.directBtnText}>{currency}</span>
            </button>

            <button
              onClick={toggleLanguage}
              className={styles.directActionBtn}
              title="Changer Langue"
            >
              <FiGlobe />{" "}
              <span className={styles.directBtnText}>
                {i18n.language.toUpperCase()}
              </span>
            </button>

            {/* --- LOGOUT OU LOGIN --- */}
            {user ? (
              <button
                onClick={handleLogout}
                className={styles.logoutDirectBtn}
                title={t("logout")}
              >
                <FiLogOut />
              </button>
            ) : (
              <Link to="/login" className={styles.loginBtn}>
                <FiLogIn /> <span>{t("login")}</span>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
