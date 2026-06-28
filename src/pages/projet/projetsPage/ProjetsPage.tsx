// src/pages/ProjetsPage/ProjetsPage.tsx

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  FiChevronLeft,
  FiFilter,
  FiSearch,
  FiSliders,
  FiX,
} from "react-icons/fi";
import ProjectCard from "../../../components/Projet/ProjetCard/ProjetCard";
import { api } from "../../../service/Api";
import { ProjetDTO } from "../../../types/projet";
import styles from "./ProjetsPage.module.css";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ─── Normalisation : retire accents + met en minuscule ────────────────────────
// "Côte d'Ivoire" == "cote d'ivoire" == "COTE D'IVOIRE" == "Senegal" == "Sénégal"
const normalize = (str: string): string =>
  (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
// ─────────────────────────────────────────────────────────────────────────────

export default function ProjetsPage() {
  const { t } = useTranslation();

  const [projects, setProjects] = useState<ProjetDTO[]>([]);
  const [loading, setLoading] = useState(true);
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
        const response =
          await api.get<ApiResponse<ProjetDTO[]>>("/api/projets");
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

    // ── Recherche insensible aux accents et à la casse ──────────────────────
    if (search.trim()) {
      const term = normalize(search);
      filtered = filtered.filter(
        (p) =>
          normalize(p.libelle).includes(term) ||
          normalize(p.description || "").includes(term) ||
          normalize(p.paysNom || "").includes(term) ||
          normalize(p.localiteNom || "").includes(term) ||
          normalize(p.secteurNom || "").includes(term),
      );
    }

    // ── Filtre secteur insensible aux accents ────────────────────────────────
    if (secteurFilter)
      filtered = filtered.filter(
        (p) => normalize(p.secteurNom || "") === normalize(secteurFilter),
      );

    // ── Filtre prix ──────────────────────────────────────────────────────────
    if (prixMin)
      filtered = filtered.filter((p) => p.prixUnePart >= Number(prixMin));
    if (prixMax)
      filtered = filtered.filter((p) => p.prixUnePart <= Number(prixMax));

    // ── Tri ──────────────────────────────────────────────────────────────────
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "financement": {
          const pA = a.objectifFinancement
            ? a.montantCollecte / a.objectifFinancement
            : 0;
          const pB = b.objectifFinancement
            ? b.montantCollecte / b.objectifFinancement
            : 0;
          return pB - pA;
        }
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
      {/* ── BOUTON MOBILE (FAB) ─────────────────────────────────────────── */}
      <button
        className={styles.mobileToggle}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle Filters"
      >
        {sidebarOpen ? <FiX size={24} /> : <FiSliders size={24} />}
      </button>

      {/* ── OVERLAY MOBILE ──────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>
            <FiFilter /> {t("projects_page.filters.title")}
          </h2>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={styles.toggleBtn}
          >
            <FiChevronLeft />
          </button>
        </div>

        <div className={styles.sidebarContent}>
          {/* Recherche */}
          <div className={styles.filterGroup}>
            <label>{t("projects_page.filters.search_label")}</label>
            <div className={styles.searchWrapper}>
              <input
                type="text"
                placeholder={t("projects_page.filters.search_placeholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
              {search && (
                <button
                  className={styles.clearBtn}
                  onClick={() => setSearch("")}
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Secteur */}
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

          {/* Prix */}
          <div className={styles.filterGroup}>
            <label>{t("projects_page.filters.price_label")}</label>
            <div className={styles.priceRange}>
              <input
                type="text"
                inputMode="numeric"
                placeholder={t("projects_page.filters.price_min")}
                value={prixMin}
                onChange={(e) =>
                  setPrixMin(e.target.value.replace(/[^0-9]/g, ""))
                }
                className={styles.priceInput}
              />
              <span>{t("projects_page.filters.to")}</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder={t("projects_page.filters.price_max")}
                value={prixMax}
                onChange={(e) =>
                  setPrixMax(e.target.value.replace(/[^0-9]/g, ""))
                }
                className={styles.priceInput}
              />
            </div>
          </div>

          {/* Tri */}
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

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
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
