import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Header.module.css";
import {
  FiPlusCircle,
  FiUser,
  FiShield,
  FiChevronDown,
  FiSearch,
  FiSettings,
  FiLogOut,
  FiLogIn,
  FiLayout,
  FiPackage,
  FiFileText,
} from "react-icons/fi";
import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../context/CurrencyContext";
import { getAvatarUrl } from "../../types/utils/UserUtils";

export default function Header() {
  const { user, logout, loading: authLoading } = useAuth();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { currency, setCurrency, rates } = useCurrency();

  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const settingsRef = useRef<HTMLDivElement>(null);
  const adminRef = useRef<HTMLDivElement>(null);

  const isAdmin = useMemo(
    () => user?.roles?.includes("ADMIN") ?? false,
    [user]
  );
  const availableCurrencies = useMemo(() => Object.keys(rates), [rates]);

  const languages = useMemo(
    () => [
      {
        code: "fr",
        label: "Français",
        flag: "https://hatscripts.github.io/circle-flags/flags/fr.svg",
      },
      {
        code: "en",
        label: "English",
        flag: "https://hatscripts.github.io/circle-flags/flags/gb.svg",
      },
      {
        code: "es",
        label: "Español",
        flag: "https://hatscripts.github.io/circle-flags/flags/es.svg",
      },
    ],
    []
  );

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("i18nextLng", lng);
    setShowSettings(false);
  };

  const handleCurrencyChange = (code: string) => {
    setCurrency(code);
    setShowSettings(false);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (settingsRef.current && !settingsRef.current.contains(target))
        setShowSettings(false);
      if (adminRef.current && !adminRef.current.contains(target))
        setShowAdminMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (authLoading) return null;

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <Link to="/" className={styles.logo}>
        <h1>growzapp</h1>
      </Link>

      <nav className={styles.nav}>
        {/* --- ACTIONS GAUCHE --- */}
        <div className={styles.navLeft}>
          {user && (
            <>
              <Link to="/projet/creer" className={styles.navLink}>
                <FiPlusCircle /> <span>{t("create_project")}</span>
              </Link>

              <Link
                to="/verifier-contrat"
                className={`${styles.navLink} ${
                  location.pathname.startsWith("/verifier-contrat")
                    ? styles.active
                    : ""
                }`}
              >
                <FiSearch /> <span>{t("link_verify_contract")}</span>
              </Link>

              {isAdmin && (
                <div className={styles.adminWrapper} ref={adminRef}>
                  <button
                    onClick={() => setShowAdminMenu(!showAdminMenu)}
                    className={`${styles.adminBtn} ${
                      showAdminMenu ? styles.active : ""
                    }`}
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
                        to="/admin/users"
                        onClick={() => setShowAdminMenu(false)}
                      >
                        <FiUser /> {t("admin.dashboard.manage_users")}
                      </Link>
                      <Link
                        to="/admin/contrats"
                        onClick={() => setShowAdminMenu(false)}
                      >
                        <FiFileText />{" "}
                        {t("admin.dashboard.contracts") || "Contrats"}
                      </Link>
                      <div className={styles.divider}></div>
                      <Link
                        to="/admin/projets"
                        onClick={() => setShowAdminMenu(false)}
                      >
                        <FiPackage /> {t("admin.dashboard.see_projects")}
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* --- SECTION DROITE --- */}
        <div className={styles.rightSection} ref={settingsRef}>
          {user ? (
            <Link to="/mon-espace" className={styles.monEspaceLink}>
              <img
                src={getAvatarUrl(user.image)}
                alt={user.prenom}
                className={styles.userAvatar}
                onError={(e) => (e.currentTarget.src = "/default-avatar.png")}
              />
              <span className={styles.userName}>{user.prenom}</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className={`${styles.actionBtn} ${styles.loginBtn}`}
            >
              <FiLogIn /> {t("login")}
            </Link>
          )}

          <button
            className={`${styles.settingsBtn} ${
              showSettings ? styles.active : ""
            }`}
            onClick={() => setShowSettings(!showSettings)}
            aria-label="Paramètres"
          >
            <FiSettings size={22} />
          </button>

          {showSettings && (
            <div className={styles.settingsMenu}>
              <div className={styles.menuSection}>
                <span className={styles.menuLabel}>Langue</span>
                <div className={styles.languageRow}>
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`${styles.flagBtn} ${
                        i18n.language === lang.code ? styles.activeFlag : ""
                      }`}
                    >
                      <img
                        src={lang.flag}
                        alt={lang.code}
                        className={styles.flagImg}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.menuSection}>
                <span className={styles.menuLabel}>Devise</span>
                <div className={styles.currencyRow}>
                  {availableCurrencies.map((code) => (
                    <button
                      key={code}
                      onClick={() => handleCurrencyChange(code)}
                      className={`${styles.currencyBtn} ${
                        currency === code ? styles.activeCurrency : ""
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>

              {user && (
                <>
                  <div className={styles.divider}></div>
                  <div className={styles.menuSection}>
                    <button
                      onClick={logout}
                      className={`${styles.actionBtn} ${styles.logoutBtn}`}
                    >
                      <FiLogOut /> {t("logout")}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
