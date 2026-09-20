// src/pages/ProjetsPage/ProjetsPage.tsx

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  FiChevronLeft,
  FiFilter,
  FiGrid,
  FiMap,
  FiSliders,
  FiX,
} from "react-icons/fi";
import ProjectsMap from "../../../components/Map/ProjectsMap";
import ProjectCard from "../../../components/Projet/ProjetCard/ProjetCard";
import { api, buildProjetUrl } from "../../../service/Api";
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
  const { t, i18n } = useTranslation();

  const [projects, setProjects] = useState<ProjetDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth > 992,
  );

  const [search, setSearch] = useState("");
  const [secteurFilter, setSecteurFilter] = useState<string>("");
  const [paysFilter, setPaysFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grille" | "carte">("grille");
  const [prixMin, setPrixMin] = useState("");
  const [prixMax, setPrixMax] = useState("");
  // Par défaut : financement décroissant, avec les plus récents en
  // départage — conforme à la règle catalogue Premium > financement > récent.
  const [sortBy, setSortBy] = useState<
    "recent" | "financement" | "prixAsc" | "prixDesc"
  >("financement");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await api.get<ApiResponse<ProjetDTO[]>>(
          buildProjetUrl("/api/projets"),
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
  }, [t, i18n.language]);

  const filtresUniques = useMemo(() => {
    const secteurs = new Set<string>();
    const pays = new Set<string>();
    projects.forEach((p) => {
      if (p.secteurNom) secteurs.add(p.secteurNom);
      if (p.paysNom) pays.add(p.paysNom);
    });
    return { secteurs: Array.from(secteurs).sort(), pays: Array.from(pays).sort() };
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

    // ── Filtre pays insensible aux accents ───────────────────────────────────
    if (paysFilter)
      filtered = filtered.filter(
        (p) => normalize(p.paysNom || "") === normalize(paysFilter),
      );

    // ── Filtre prix ──────────────────────────────────────────────────────────
    if (prixMin)
      filtered = filtered.filter((p) => p.prixUnePart >= Number(prixMin));
    if (prixMax)
      filtered = filtered.filter((p) => p.prixUnePart <= Number(prixMax));

    // ── Tri ──────────────────────────────────────────────────────────────────
    const comparer = (a: ProjetDTO, b: ProjetDTO) => {
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
          if (pB !== pA) return pB - pA;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        case "prixAsc":
          return a.prixUnePart - b.prixUnePart;
        case "prixDesc":
          return b.prixUnePart - a.prixUnePart;
        default:
          return 0;
      }
    };

    // Règle métier : les projets Premium sont toujours groupés en tête du
    // catalogue, quel que soit le tri choisi par l'utilisateur — celui-ci ne
    // s'applique qu'à l'intérieur de chaque groupe (Premium / non-Premium).
    const premium = filtered.filter((p) => p.premiumActif);
    const autres = filtered.filter((p) => !p.premiumActif);
    return [...premium.sort(comparer), ...autres.sort(comparer)];
  }, [projects, search, secteurFilter, paysFilter, prixMin, prixMax, sortBy]);

  const mapPoints = useMemo(
    () =>
      filteredProjects
        .filter((p) => p.latitude != null && p.longitude != null)
        .map((p) => ({
          id: p.id,
          slug: p.slug,
          libelle: p.libelleTradu || p.libelle,
          latitude: p.latitude as number,
          longitude: p.longitude as number,
          localiteNom: p.localiteNom,
        })),
    [filteredProjects],
  );

  if (loading)
    return <div className={styles.loading}>{t("projects_page.loading")}</div>;

  return (
    <div className={styles.pageContainer}>
      {/* ── BOUTON MOBILE (FAB) ─────────────────────────────────────────── */}
      {/* Toujours affiché sur mobile (géré par la media query CSS).
          Sur desktop, sert de secours pour rouvrir le filtre une fois
          fermé, puisque le sidebar (et son bouton toggle interne) sort
          alors entièrement de l'écran. */}
      <button
        className={`${styles.mobileToggle} ${!sidebarOpen ? styles.visible : ""}`}
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

          {/* Pays */}
          <div className={styles.filterGroup}>
            <label>{t("projects_page.filters.country_label")}</label>
            <select
              value={paysFilter}
              onChange={(e) => setPaysFilter(e.target.value)}
              className={styles.select}
            >
              <option value="">{t("projects_page.filters.all_countries")}</option>
              {filtresUniques.pays.map((p) => (
                <option key={p} value={p}>
                  {p}
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
        <div className={styles.viewToggle}>
          <button
            className={viewMode === "grille" ? styles.viewToggleActive : ""}
            onClick={() => setViewMode("grille")}
          >
            <FiGrid size={16} /> {t("projects_page.view.grid")}
          </button>
          <button
            className={viewMode === "carte" ? styles.viewToggleActive : ""}
            onClick={() => setViewMode("carte")}
          >
            <FiMap size={16} /> {t("projects_page.view.map")}
          </button>
        </div>

        {viewMode === "carte" ? (
          mapPoints.length === 0 ? (
            <div className={styles.empty}>
              <h3>{t("projects_page.view.map_no_points")}</h3>
            </div>
          ) : (
            <ProjectsMap points={mapPoints} height={560} />
          )
        ) : filteredProjects.length === 0 ? (
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
