import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiChevronDown,
  FiDollarSign,
  FiGlobe,
  FiLogIn,
  FiLogOut,
  FiMapPin,
  FiPlusCircle,
  FiSearch,
  FiShield,
  FiUser,
  FiCheck,
  FiCheckCircle,
  FiRss,
  FiShoppingBag,
  FiMenu,
  FiX,
  FiMail,
} from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
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

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [openSection, setOpenSection] = useState<"espace" | "devise" | "langue" | null>(null);
  const toggleSection = (section: "espace" | "devise" | "langue") =>
    setOpenSection((prev) => (prev === section ? null : section));
  const [scrolled, setScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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
    setShowMobileMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
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

      <button
        className={styles.hamburgerBtn}
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        aria-label="Menu"
      >
        {showMobileMenu ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      <nav className={`${styles.nav} ${showMobileMenu ? styles.navOpen : ""}`}>
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
              <Link to="/growzmarket" className={styles.navLink}>
                <FiShoppingBag />
                <span>{t("header.growzmarket", "GrowzMarket")}</span>
              </Link>
              <Link to="/projets-finances" className={styles.navLink}>
                <FiCheckCircle />
                <span>{t("header.financed_projects")}</span>
              </Link>
              <Link to="/mon-espace/contact" className={styles.navLink}>
                <FiMail />
                <span>{t("header.contact_us")}</span>
              </Link>
              {isAdmin && (
                <Link to="/admin" className={styles.adminBtn}>
                  <FiShield /> <span>{t("admin_space")}</span>
                </Link>
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
                      {/* ── MON ESPACE ── */}
                      <button
                        type="button"
                        className={styles.profileMenuLabel}
                        onClick={() => toggleSection("espace")}
                      >
                        <FiChevronDown
                          size={13}
                          className={`${styles.sectionChevron} ${openSection === "espace" ? styles.sectionChevronOpen : ""}`}
                        />
                        <FiUser size={13} /> Mon espace
                      </button>
                      {openSection === "espace" && (
                        <div className={styles.profileMenuOptions}>
                          <Link
                            to="/mon-espace"
                            className={styles.profileMenuItem}
                            onClick={() => setShowProfileMenu(false)}
                          >
                            Accéder à mon espace
                          </Link>
                        </div>
                      )}

                      <div className={styles.divider}></div>

                      {/* ── DEVISE ── */}
                      <button
                        type="button"
                        className={styles.profileMenuLabel}
                        onClick={() => toggleSection("devise")}
                      >
                        <FiChevronDown
                          size={13}
                          className={`${styles.sectionChevron} ${openSection === "devise" ? styles.sectionChevronOpen : ""}`}
                        />
                        <FiDollarSign size={13} /> Devise ({currency})
                      </button>
                      {openSection === "devise" && (
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
                      )}

                      {/* ── LANGUE ── */}
                      <button
                        type="button"
                        className={styles.profileMenuLabel}
                        onClick={() => toggleSection("langue")}
                      >
                        <FiChevronDown
                          size={13}
                          className={`${styles.sectionChevron} ${openSection === "langue" ? styles.sectionChevronOpen : ""}`}
                        />
                        <FiGlobe size={13} /> Langue
                      </button>
                      {openSection === "langue" && (
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
                      )}

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
      {showMobileMenu && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setShowMobileMenu(false)}
        />
      )}
    </header>
  );
}
