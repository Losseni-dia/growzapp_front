import { useState } from "react";
import { Outlet } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useAuth } from "../Context/AuthContext";
import AdminSidebar from "./AdminSidebar";
import styles from "./AdminLayout.module.css";

export default function AdminLayout() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.roles?.includes("ADMIN") ?? false;
  const isCommunicant = user?.roles?.includes("COMMUNICANT") ?? false;

  return (
    <div className={styles.shell}>
      <button
        type="button"
        className={styles.mobileToggle}
        onClick={() => setMobileOpen((v) => !v)}
        aria-label={t("admin.sidebar.toggle")}
      >
        {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      <div
        className={`${styles.sidebarWrap} ${mobileOpen ? styles.sidebarWrapOpen : ""}`}
      >
        <AdminSidebar
          isAdmin={isAdmin}
          isCommunicant={isCommunicant}
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
