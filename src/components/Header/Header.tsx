import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiChevronDown,
  FiDollarSign,
  FiGlobe,
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
  FiShoppingCart,
  FiMenu,
  FiX,
  FiMail,
} from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import FlagIcon from "./FlagIcon";
import { getAvatarUrl } from "../../types/utils/UserUtils";
import { useAuth } from "../Context/AuthContext";
import { useGrowzMarketCart } from "../Context/GrowzMarketCartContext";
import { useCurrency } from "../Context/CurrencyContext";
import styles from "./Header.module.css";

import NotificationBell from "../../pages/notification/notificationBell/NotificationBell";

export default function Header() {
  const { user, logout, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { currency, setCurrency, rates } = useCurrency();
  const { totalItems } = useGrowzMarketCart();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [openSection, setOpenSection] = useState<"espace" | "devise" | "langue" | null>(null);
  const toggleSection = (section: "espace" | "devise" | "langue") =>
    setOpenSection((prev) => (prev === section ? null : section));
  const [scrolled, setScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Sélecteur langue/devise pour les visiteurs non connectés — avant ce
  // correctif, ces réglages n'existaient que dans le menu profil, donc
  // inaccessibles à quiconque n'est pas connecté (faille UX remontée par
  // des testeurs externes).
  const [showGuestMenu, setShowGuestMenu] = useState(false);
  const [guestSection, setGuestSection] = useState<"devise" | "langue" | null>(null);
  const toggleGuestSection = (section: "devise" | "langue") =>
    setGuestSection((prev) => (prev === section ? null : section));
  const guestMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = useMemo(
    () => user?.roles?.includes("ADMIN") ?? false,
    [user],
  );
  const availableCurrencies = useMemo(() => Object.keys(rates), [rates]);
  const languages = [
    { code: "fr", label: "Français", flagCode: "fr" },
    { code: "en", label: "English", flagCode: "gb" },
    { code: "es", label: "Español", flagCode: "es" },
  ];
  const currentLanguage = languages.find((l) => l.code === i18n.language) ?? languages[0];

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
      if (guestMenuRef.current && !guestMenuRef.current.contains(e.target as Node))
        setShowGuestMenu(false);
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
              <Link to="/projets-finances" className={styles.navLink}>
                <FiCheckCircle />
                <span>{t("header.financed_projects")}</span>
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
              <Link to="/mon-espace/contact" className={styles.navLink}>
                <FiMail />
                <span>{t("header.contact_us")}</span>
              </Link>
              <Link to="/growzmarket" className={styles.navLink}>
                <FiShoppingBag />
                <span>{t("header.growzmarket", "GrowzMarket")}</span>
              </Link>
              <Link
                to="/growzmarket/panier"
                className={styles.navLink}
                aria-label={t("growzmarket.cart.nav_label", "Panier")}
              >
                <span style={{ position: "relative", display: "inline-flex" }}>
                  <FiShoppingCart />
                  {totalItems > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: -8,
                        right: -10,
                        background: "var(--growz-primary, #1B5E20)",
                        color: "white",
                        borderRadius: "50%",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        minWidth: 16,
                        height: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 3px",
                      }}
                    >
                      {totalItems}
                    </span>
                  )}
                </span>
                <span>{t("growzmarket.cart.nav_label", "Panier")}</span>
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
                        <FiDollarSign size={13} /> {t("header.currency", "Devise")} ({currency})
                      </button>
                      {openSection === "devise" && (
                        <div className={styles.profileMenuOptions}>
                          {availableCurrencies.map((c) => (
                            <button
                              key={c}
                              className={`${styles.profileMenuOption} ${currency === c ? styles.optionActive : ""}`}
                              onClick={() => {
                                setCurrency(c);
                                setShowProfileMenu(false);
                              }}
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
                        <FiGlobe size={13} /> {t("header.language", "Langue")}
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
                                setShowProfileMenu(false);
                              }}
                            >
                              <FlagIcon code={lang.flagCode} /> {lang.label}
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
              <>
                <div className={styles.profileWrapper} ref={guestMenuRef}>
                  <button
                    onClick={() => setShowGuestMenu(!showGuestMenu)}
                    className={`${styles.profileTrigger} ${showGuestMenu ? styles.active : ""}`}
                    aria-label={t("header.settings", "Langue et devise")}
                  >
                    <FlagIcon code={currentLanguage.flagCode} />
                    <span className={styles.userName}>{currency}</span>
                    <FiChevronDown className={styles.chevron} />
                  </button>

                  {showGuestMenu && (
                    <div className={styles.profileMenu}>
                      {/* ── DEVISE ── */}
                      <button
                        type="button"
                        className={styles.profileMenuLabel}
                        onClick={() => toggleGuestSection("devise")}
                      >
                        <FiChevronDown
                          size={13}
                          className={`${styles.sectionChevron} ${guestSection === "devise" ? styles.sectionChevronOpen : ""}`}
                        />
                        <FiDollarSign size={13} /> {t("header.currency", "Devise")} ({currency})
                      </button>
                      {guestSection === "devise" && (
                        <div className={styles.profileMenuOptions}>
                          {availableCurrencies.map((c) => (
                            <button
                              key={c}
                              className={`${styles.profileMenuOption} ${currency === c ? styles.optionActive : ""}`}
                              onClick={() => {
                                setCurrency(c);
                                setShowGuestMenu(false);
                              }}
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
                        onClick={() => toggleGuestSection("langue")}
                      >
                        <FiChevronDown
                          size={13}
                          className={`${styles.sectionChevron} ${guestSection === "langue" ? styles.sectionChevronOpen : ""}`}
                        />
                        <FiGlobe size={13} /> {t("header.language", "Langue")}
                      </button>
                      {guestSection === "langue" && (
                        <div className={styles.profileMenuOptions}>
                          {languages.map((lang) => (
                            <button
                              key={lang.code}
                              className={`${styles.profileMenuOption} ${i18n.language === lang.code ? styles.optionActive : ""}`}
                              onClick={() => {
                                i18n.changeLanguage(lang.code);
                                localStorage.setItem("i18nextLng", lang.code);
                                setShowGuestMenu(false);
                              }}
                            >
                              <FlagIcon code={lang.flagCode} /> {lang.label}
                              {i18n.language === lang.code && (
                                <FiCheck size={13} />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Link to="/login" className={styles.loginBtn}>
                  <span>{t("header.login", "Se connecter")}</span>
                </Link>
                <Link to="/register" className={styles.registerBtn}>
                  <span>{t("header.register", "S'inscrire")}</span>
                </Link>
              </>
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
