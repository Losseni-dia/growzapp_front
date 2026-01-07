import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiMapPin, FiGrid, FiMap, FiTrendingUp } from "react-icons/fi";
import SecteurManager from "../SecteurManager/SecteurManager";
import LocaliteManager from "../LocalitesManager/LocaliteManager";
import LocalisationManager from "../LocalisationManager/LocalisationManager";
import AdminStatsPanel from "../../GlobalStatsGraphiques/GlobalStats"; // Nouveau composant
import styles from "./ProjectSettingsPanel.module.css";

// Mise à jour du type pour inclure "stats"
type Tab = "secteurs" | "localites" | "localisations" | "stats";

export default function ProjectSettingsPanel() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("stats"); // Par défaut sur stats pour l'effet Waooo

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>{t("admin.settings.title") || "Configuration & Analyses"}</h1>
        <div className={styles.tabs}>
          {/* Nouvel Onglet Analyses */}
          <button 
            className={activeTab === "stats" ? styles.activeTab : ""} 
            onClick={() => setActiveTab("stats")}
          >
            <FiTrendingUp /> {t("admin.settings.analytics") || "Analyses"}
          </button>

          <button 
            className={activeTab === "secteurs" ? styles.activeTab : ""} 
            onClick={() => setActiveTab("secteurs")}
          >
            <FiGrid /> {t("admin.settings.sectors") || "Secteurs"}
          </button>

          <button 
            className={activeTab === "localites" ? styles.activeTab : ""} 
            onClick={() => setActiveTab("localites")}
          >
            <FiMap /> {t("admin.settings.localities") || "Villes / Localités"}
          </button>

          <button 
            className={activeTab === "localisations" ? styles.activeTab : ""} 
            onClick={() => setActiveTab("localisations")}
          >
            <FiMapPin /> {t("admin.settings.sites") || "Sites Projets"}
          </button>
        </div>
      </header>

      <main className={styles.content}>
        {/* Affichage conditionnel des composants */}
        {activeTab === "stats" && <AdminStatsPanel />}
        {activeTab === "secteurs" && <SecteurManager />}
        {activeTab === "localites" && <LocaliteManager />}
        {activeTab === "localisations" && <LocalisationManager />}
      </main>
    </div>
  );
}