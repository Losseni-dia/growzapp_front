// src/pages/ProjetsPage/ProjetsPage.tsx

import { useState, useMemo, useEffect } from "react";
import ProjectCard from "../../components/Projet/ProjetCard/ProjetCard";
import styles from "./ProjetsPage.module.css";
import { api } from "../../service/api";
import { ProjetDTO } from "../../types/projet";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  FiSearch,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiSliders, // <--- NOUVELLE ICÔNE POUR LE BOUTON ROND
  FiX, // <--- POUR FERMER
} from "react-icons/fi";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export default function ProjetsPage() {
  const { t } = useTranslation();

  const [projects, setProjects] = useState<ProjetDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Par défaut true sur Desktop, mais le CSS gère le masquage sur mobile initialement
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [search, setSearch] = useState("");
  const [secteurFilter, setSecteurFilter] = useState<string>("");
  const [prixMin, setPrixMin] = useState("");
  const [prixMax, setPrixMax] = useState("");
  const [sortBy, setSortBy] = useState<
    "recent" | "financement" | "prixAsc" | "prixDesc"
  >("recent");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await api.get<ApiResponse<ProjetDTO[]>>(
          "/api/projets"
        );
        setProjects(response.data || []);
      } catch (err: any) {
        toast.error(t("projects_page.toast_error"));
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [t]);

  const filtresUniques = useMemo(() => {
    const secteurs = new Set<string>();
    projects.forEach((p) => p.secteurNom && secteurs.add(p.secteurNom));
    return { secteurs: Array.from(secteurs).sort() };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let filtered = projects;

    if (search.trim()) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.libelle.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term) ||
          p.paysNom?.toLowerCase().includes(term) ||
          p.localiteNom?.toLowerCase().includes(term) ||
          p.secteurNom?.toLowerCase().includes(term)
      );
    }

    if (secteurFilter)
      filtered = filtered.filter((p) => p.secteurNom === secteurFilter);
    if (prixMin)
      filtered = filtered.filter((p) => p.prixUnePart >= Number(prixMin));
    if (prixMax)
      filtered = filtered.filter((p) => p.prixUnePart <= Number(prixMax));

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "financement":
          const percentA = a.objectifFinancement
            ? a.montantCollecte / a.objectifFinancement
            : 0;
          const percentB = b.objectifFinancement
            ? b.montantCollecte / b.objectifFinancement
            : 0;
          return percentB - percentA;
        case "prixAsc":
          return a.prixUnePart - b.prixUnePart;
        case "prixDesc":
          return b.prixUnePart - a.prixUnePart;
        default:
          return 0;
      }
    });
  }, [projects, search, secteurFilter, prixMin, prixMax, sortBy]);

  if (loading)
    return <div className={styles.loading}>{t("projects_page.loading")}</div>;

  return (
    <div className={styles.pageContainer}>
      {/* 1. NOUVEAU BOUTON MOBILE (FAB) */}
      {/* Il est toujours dans le DOM, le CSS gère l'affichage (display: none sur PC) */}
      <button
        className={styles.mobileToggle}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle Filters"
      >
        {sidebarOpen ? <FiX size={24} /> : <FiSliders size={24} />}
      </button>

      {/* 2. OVERLAY (Fond noir) pour fermer sur mobile */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* 3. SIDEBAR */}
      {/* On applique la classe .open si le state est true */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>
            <FiFilter /> {t("projects_page.filters.title")}
          </h2>

          {/* Bouton de collapse pour Desktop (Optionnel, tu peux le garder ou l'enlever) */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={styles.toggleBtn}
          >
            <FiChevronLeft />
          </button>
        </div>

        {/* Contenu de la sidebar */}
        <div className={styles.sidebarContent}>
          <div className={styles.filterGroup}>
            <label>{t("projects_page.filters.search_label")}</label>
            <div className={styles.searchWrapper}>
              <FiSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder={t("projects_page.filters.search_placeholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label>{t("projects_page.filters.sector_label")}</label>
            <select
              value={secteurFilter}
              onChange={(e) => setSecteurFilter(e.target.value)}
              className={styles.select}
            >
              <option value="">{t("projects_page.filters.all_sectors")}</option>
              {filtresUniques.secteurs.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>{t("projects_page.filters.price_label")}</label>
            <div className={styles.priceRange}>
              <input
                type="number"
                placeholder={t("projects_page.filters.price_min")}
                value={prixMin}
                onChange={(e) => setPrixMin(e.target.value)}
                className={styles.priceInput}
              />
              <span>{t("projects_page.filters.to")}</span>
              <input
                type="number"
                placeholder={t("projects_page.filters.price_max")}
                value={prixMax}
                onChange={(e) => setPrixMax(e.target.value)}
                className={styles.priceInput}
              />
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label>{t("projects_page.filters.sort_label")}</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={styles.select}
            >
              <option value="recent">
                {t("projects_page.filters.sort_recent")}
              </option>
              <option value="financement">
                {t("projects_page.filters.sort_funding")}
              </option>
              <option value="prixAsc">
                {t("projects_page.filters.sort_price_asc")}
              </option>
              <option value="prixDesc">
                {t("projects_page.filters.sort_price_desc")}
              </option>
            </select>
          </div>

          <div className={styles.resultsCount}>
            {filteredProjects.length} {t("projects_page.filters.results")}
          </div>
        </div>
      </aside>

      {/* 4. MAIN CONTENT */}
      <main className={styles.main}>
        {filteredProjects.length === 0 ? (
          <div className={styles.empty}>
            <h3>{t("projects_page.empty.title")}</h3>
            <p>{t("projects_page.empty.subtitle")}</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredProjects.map((projet) => (
              <ProjectCard key={projet.id} projet={projet} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
