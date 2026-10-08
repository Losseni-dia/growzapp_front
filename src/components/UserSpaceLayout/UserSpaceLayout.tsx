import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useAuth } from "../Context/AuthContext";
import UserSpaceSidebar from "./UserSpaceSidebar";
import styles from "./UserSpaceLayout.module.css";

export default function UserSpaceLayout() {
  const { t } = useTranslation();
  const { user, reloadUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Rafraîchit les rôles à chaque entrée dans "Mon Espace" : PORTEUR,
  // INVESTISSEUR et FOURNISSEUR sont attribués côté serveur après coup
  // (validation de projet, premier investissement, fiche fournisseur) et ne
  // sont donc pas forcément à jour dans la session déjà chargée.
  useEffect(() => {
    reloadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isInvestisseur = user?.roles?.includes("INVESTISSEUR") ?? false;
  const isPorteur = user?.roles?.includes("PORTEUR") ?? false;
  const isFournisseur = user?.roles?.includes("FOURNISSEUR") ?? false;

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
          isPorteur={isPorteur}
          isFournisseur={isFournisseur}
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
