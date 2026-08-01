import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiCheckCircle, FiX } from "react-icons/fi";
import ProjectCard from "../../../components/Projet/ProjetCard/ProjetCard";
import { api, buildProjetUrl } from "../../../service/Api";
import { ProjetDTO } from "../../../types/projet";
import styles from "./ProjetsFinancesPage.module.css";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const normalize = (str: string): string =>
  (str || "")
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLowerCase()
    .trim();

export default function ProjetsFinancesPage() {
  const { t, i18n } = useTranslation();
  const [projects, setProjects] = useState<ProjetDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await api.get<ApiResponse<ProjetDTO[]>>(
          buildProjetUrl("/api/projets/finances"),
        );
        setProjects(response.data || []);
      } catch (err: any) {
        toast.error(t("financed_projects_page.toast_error"));
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [t, i18n.language]);

  const filteredProjects = useMemo(() => {
    if (!search.trim()) return projects;
    const term = normalize(search);
    return projects.filter(
      (p) =>
        normalize(p.libelle).includes(term) ||
        normalize(p.secteurNom || "").includes(term) ||
        normalize(p.localiteNom || "").includes(term),
    );
  }, [projects, search]);

  if (loading)
    return (
      <div className={styles.loading}>
        {t("financed_projects_page.loading")}
      </div>
    );

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <FiCheckCircle size={22} />
        </div>
        <div>
          <h1 className={styles.title}>
            {t("financed_projects_page.title")}
          </h1>
          <p className={styles.subtitle}>
            {t("financed_projects_page.subtitle", {
              count: projects.length,
            })}
          </p>
        </div>
      </header>

      <div className={styles.searchWrapper}>
        <input
          type="text"
          placeholder={t("financed_projects_page.search_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        {search && (
          <button className={styles.clearBtn} onClick={() => setSearch("")}>
            <FiX size={14} />
          </button>
        )}
      </div>

      {filteredProjects.length === 0 ? (
        <div className={styles.empty}>
          <h3>{t("financed_projects_page.empty.title")}</h3>
          <p>{t("financed_projects_page.empty.subtitle")}</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredProjects.map((projet) => (
            <ProjectCard key={projet.id} projet={projet} />
          ))}
        </div>
      )}
    </div>
  );
}
