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
  FiUser,
  FiCheck,
  FiRss,
} from "react-icons/fi";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { getAvatarUrl } from "../../types/utils/UserUtils";
import { useAuth } from "../Context/AuthContext";
import { useCurrency } from "../Context/CurrencyContext";
import styles from "./Header.module.css";

import NotificationBell from "../../pages/notification/notificationBell/NotificationBell";

export default function Header() {
  const { user, logout, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { currency, setCurrency, rates } = useCurrency();

  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const adminRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const isAdmin = useMemo(
    () => user?.roles?.includes("ADMIN") ?? false,
    [user],
  );
  const availableCurrencies = useMemo(() => Object.keys(rates), [rates]);
  const languages = [
    { code: "fr", label: "Français" },
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
  ];

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
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setShowProfileMenu(false);
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
          style={{ height: "40px", width: "auto" }}
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
                <span>{t("header.nearby")}</span>
              </Link>
              <Link
                to="/verifier-contrat"
                className={`${styles.navLink} ${location.pathname.startsWith("/verifier-contrat") ? styles.active : ""}`}
              >
                <FiSearch /> <span>{t("link_verify_contract")}</span>
              </Link>
              <Link to="/news" className={styles.navLink}>
                <FiRss />
                <span>{t("header.news")}</span>
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
            {user ? (
              <>
                <NotificationBell />

                <div className={styles.profileWrapper} ref={profileRef}>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className={`${styles.profileTrigger} ${showProfileMenu ? styles.active : ""}`}
                  >
                    <img
                      src={getAvatarUrl(user.image)}
                      alt={user.prenom}
                      className={styles.userAvatar}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/default-avatar.svg";
                      }}
                    />
                    <span className={styles.userName}>{user.prenom}</span>
                    <FiChevronDown className={styles.chevron} />
                  </button>

                  {showProfileMenu && (
                    <div className={styles.profileMenu}>
                      <Link
                        to="/mon-espace"
                        className={styles.profileMenuItem}
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <FiUser /> Mon espace
                      </Link>

                      <div className={styles.divider}></div>

                      <div className={styles.profileMenuLabel}>
                        <FiDollarSign size={13} /> Devise
                      </div>
                      <div className={styles.profileMenuOptions}>
                        {availableCurrencies.map((c) => (
                          <button
                            key={c}
                            className={`${styles.profileMenuOption} ${currency === c ? styles.optionActive : ""}`}
                            onClick={() => setCurrency(c)}
                          >
                            {c}
                            {currency === c && <FiCheck size={13} />}
                          </button>
                        ))}
                      </div>

                      <div className={styles.profileMenuLabel}>
                        <FiGlobe size={13} /> Langue
                      </div>
                      <div className={styles.profileMenuOptions}>
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            className={`${styles.profileMenuOption} ${i18n.language === lang.code ? styles.optionActive : ""}`}
                            onClick={() => {
                              i18n.changeLanguage(lang.code);
                              localStorage.setItem("i18nextLng", lang.code);
                            }}
                          >
                            {lang.label}
                            {i18n.language === lang.code && (
                              <FiCheck size={13} />
                            )}
                          </button>
                        ))}
                      </div>

                      <div className={styles.divider}></div>

                      <button
                        onClick={handleLogout}
                        className={styles.profileMenuLogout}
                      >
                        <FiLogOut /> {t("logout") || "Déconnexion"}
                      </button>
                    </div>
                  )}
                </div>
              </>
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
