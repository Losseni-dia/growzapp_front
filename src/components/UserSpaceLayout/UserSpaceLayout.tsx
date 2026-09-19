import { useState } from "react";
import { Outlet } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useAuth } from "../Context/AuthContext";
import UserSpaceSidebar from "./UserSpaceSidebar";
import styles from "./UserSpaceLayout.module.css";

export default function UserSpaceLayout() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isInvestisseur = user?.roles?.includes("INVESTISSEUR") ?? false;

  return (
    <div className={styles.shell}>
      <button
        type="button"
        className={styles.mobileToggle}
        onClick={() => setMobileOpen((v) => !v)}
        aria-label={t("user_sidebar.toggle", "Ouvrir le menu")}
      >
        {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      <div
        className={`${styles.sidebarWrap} ${mobileOpen ? styles.sidebarWrapOpen : ""}`}
      >
        <UserSpaceSidebar
          isInvestisseur={isInvestisseur}
          onNavigate={() => setMobileOpen(false)}
        />
      </div>

      {mobileOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}
