// src/pages/ProjetsPage/ProjetsPage.tsx
// VERSION FINALE 2025 – SIDEBAR RÉTRACTABLE + TRIS INTELLIGENTS

import { useState, useMemo, useEffect } from "react";
import ProjectCard from "../../components/Projet/ProjetCard/ProjetCard";
import styles from "./ProjetsPage.module.css";
import { api } from "../../service/api";
import { ProjetDTO } from "../../types/projet";
import toast from "react-hot-toast";
import {
  FiSearch,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export default function ProjetsPage() {
  const [projects, setProjects] = useState<ProjetDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true); // ← Sidebar visible par défaut

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
        toast.error("Impossible de charger les projets");
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

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
    return <div className={styles.loading}>Chargement des projets...</div>;

  return (
    <div className={styles.pageContainer}>
      {/* SIDEBAR FIXE + BOUTON CACHÉ/MONTRÉ */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>
            <FiFilter /> Filtres
          </h2>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={styles.toggleBtn}
            aria-label={
              sidebarOpen ? "Cacher les filtres" : "Afficher les filtres"
            }
          >
            {sidebarOpen ? <FiChevronLeft /> : <FiChevronRight />}
          </button>
        </div>

        {sidebarOpen && (
          <div className={styles.sidebarContent}>
            <div className={styles.filterGroup}>
              <label>Recherche</label>
              <div className={styles.searchWrapper}>
                <FiSearch className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Nom, ville, pays, secteur..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label>Secteur</label>
              <select
                value={secteurFilter}
                onChange={(e) => setSecteurFilter(e.target.value)}
                className={styles.select}
              >
                <option value="">Tous</option>
                {filtresUniques.secteurs.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Prix par part</label>
              <div className={styles.priceRange}>
                <input
                  type="number"
                  placeholder="Min"
                  value={prixMin}
                  onChange={(e) => setPrixMin(e.target.value)}
                  className={styles.priceInput}
                />
                <span>à</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={prixMax}
                  onChange={(e) => setPrixMax(e.target.value)}
                  className={styles.priceInput}
                />
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label>Trier par</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={styles.select}
              >
                <option value="recent">Plus récent</option>
                <option value="financement">Meilleur financement</option>
                <option value="prixAsc">Prix croissant</option>
                <option value="prixDesc">Prix décroissant</option>
              </select>
            </div>

            <div className={styles.resultsCount}>
              {filteredProjects.length} projet
              {filteredProjects.length > 1 ? "s" : ""}
            </div>
          </div>
        )}
      </aside>

      {/* BOUTON MOBILE SI SIDEBAR CACHÉE */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className={styles.mobileToggle}
        >
          <FiFilter /> Filtres
        </button>
      )}

      {/* CONTENU PRINCIPAL */}
      <main className={styles.main}>
        {filteredProjects.length === 0 ? (
          <div className={styles.empty}>
            <h3>Aucun projet trouvé</h3>
            <p>Modifiez vos filtres</p>
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
