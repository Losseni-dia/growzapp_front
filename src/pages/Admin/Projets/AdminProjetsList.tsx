import React, { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  FiCheckCircle,
  FiEdit,
  FiEye,
  FiTrash2,
  FiXCircle,
  FiSearch,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { api } from "../../../service/Api";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import styles from "./AdminProjetsList.module.css";

interface ProjetAdmin {
  id: number;
  slug: string;
  libelle: string;
  statutProjet: string;
  porteurPrenom?: string;
  porteurNom: string;
  poster?: string;
  montantCollecte: number;
  objectifFinancement: number;
  secteurNom?: string;
  localiteNom?: string;
  createdAt?: string;
}

type SortKey = "recent" | "ancien" | "collecte" | "objectif";

export default function AdminProjetsList() {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("TOUS");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [secteurFilter, setSecteurFilter] = useState("TOUS");

  const { data: projetsData, isLoading } = useQuery({
    queryKey: ["admin-projets"],
    queryFn: () => api.get<{ data: ProjetAdmin[] }>("/api/admin/projets"),
  });

  const projets = projetsData?.data || [];

  // Secteurs uniques pour le filtre
  const secteurs = useMemo(() => {
    const s = new Set(projets.map((p) => p.secteurNom).filter(Boolean));
    return ["TOUS", ...Array.from(s)] as string[];
  }, [projets]);

  const filteredProjets = useMemo(() => {
    let list = projets.filter((p) => {
      const matchesTab = activeTab === "TOUS" || p.statutProjet === activeTab;
      const matchesSecteur =
        secteurFilter === "TOUS" || p.secteurNom === secteurFilter;
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        (p.libelle || "").toLowerCase().includes(search) ||
        (p.porteurNom || "").toLowerCase().includes(search) ||
        (p.porteurPrenom || "").toLowerCase().includes(search) ||
        (p.secteurNom || "").toLowerCase().includes(search) ||
        (p.localiteNom || "").toLowerCase().includes(search) ||
        (p.createdAt || "").includes(search);
      return matchesTab && matchesSecteur && matchesSearch;
    });

    // Tri
    list = [...list].sort((a, b) => {
      if (sortKey === "recent")
        return (
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
        );
      if (sortKey === "ancien")
        return (
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
        );
      if (sortKey === "collecte")
        return (
          b.montantCollecte / (b.objectifFinancement || 1) -
          a.montantCollecte / (a.objectifFinancement || 1)
        );
      if (sortKey === "objectif")
        return b.objectifFinancement - a.objectifFinancement;
      return 0;
    });

    return list;
  }, [projets, searchTerm, activeTab, secteurFilter, sortKey]);

  const validerMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/api/admin/projets/${id}/valider`),
    onSuccess: () => {
      toast.success(t("admin.withdrawals.toast.validate_success"));
      queryClient.invalidateQueries({ queryKey: ["admin-projets"] });
    },
  });

  const rejeterMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/api/admin/projets/${id}/rejeter`),
    onSuccess: () => {
      toast.success(t("admin.withdrawals.toast.reject_success"));
      queryClient.invalidateQueries({ queryKey: ["admin-projets"] });
    },
  });

  const supprimerMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/projets/${id}`),
    onSuccess: () => {
      toast.success(t("admin.roles.success"));
      queryClient.invalidateQueries({ queryKey: ["admin-projets"] });
    },
  });

  const handleSupprimer = (id: number, libelle: string) => {
    if (window.confirm(t("admin.projects.confirm_delete", { name: libelle }))) {
      supprimerMutation.mutate(id);
    }
  };

  const getStatutClass = (statut: string) => {
    switch (statut?.toUpperCase()) {
      case "VALIDE":
        return styles.badgeValide;
      case "SOUMIS":
        return styles.badgeSoumis;
      case "EN_ATTENTE":
        return styles.badgeSoumis;
      case "REJETE":
        return styles.badgeRejete;
      case "TERMINE":
        return styles.badgeTermine;
      case "EN_COURS":
        return styles.badgeEnCours;
      default:
        return styles.badgeDefault;
    }
  };

  if (isLoading)
    return <div className={styles.loading}>{t("dashboard.loading")}</div>;

  return (
    <div className={styles.container}>
      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <div className={styles.headerManagement}>
        <h1 className={styles.title}>
          {t("admin.dashboard.see_projects")}
          <span className={styles.totalCount}>{filteredProjets.length}</span>
        </h1>

        {/* Barre de recherche */}
        <div className={styles.searchContainer}>        
          <input
            type="text"
            placeholder="Nom, porteur, ville, secteur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button
              className={styles.clearSearch}
              onClick={() => setSearchTerm("")}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── FILTRES & TRI ─────────────────────────────────────────────────── */}
      <div className={styles.filtersBar}>
        {/* Onglets statut */}
        <div className={styles.tabsWrapper}>
          {["TOUS", "SOUMIS", "VALIDE", "REJETE"].map((tab) => (
            <button
              key={tab}
              className={`${styles.tabButton} ${activeTab === tab ? styles.activeTab : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
              <span className={styles.countBadge}>
                {
                  projets.filter(
                    (p) => tab === "TOUS" || p.statutProjet === tab,
                  ).length
                }
              </span>
            </button>
          ))}
        </div>

        {/* Tri + Secteur */}
        <div className={styles.sortBar}>
          <select
            className={styles.select}
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="recent">⬇ Plus récent</option>
            <option value="ancien">⬆ Plus ancien</option>
            <option value="collecte">📈 % collecté</option>
            <option value="objectif">💰 Objectif</option>
          </select>

          <select
            className={styles.select}
            value={secteurFilter}
            onChange={(e) => setSecteurFilter(e.target.value)}
          >
            {secteurs.map((s) => (
              <option key={s} value={s}>
                {s === "TOUS" ? "Tous les secteurs" : s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── GRILLE ───────────────────────────────────────────────────────── */}
      <div className={styles.grid}>
        {filteredProjets.map((p) => {
          const progression =
            p.objectifFinancement > 0
              ? (p.montantCollecte / p.objectifFinancement) * 100
              : 0;

          return (
            <div key={p.id} className={styles.card}>
              <div className={styles.posterWrapper}>
                {p.poster ? (
                  <img
                    src={p.poster}
                    alt={p.libelle}
                    className={styles.poster}
                  />
                ) : (
                  <div className={styles.noPoster}>
                    {t("admin.projects.no_poster")}
                  </div>
                )}
                <div
                  className={`${styles.statutBadge} ${getStatutClass(p.statutProjet)}`}
                >
                  {p.statutProjet}
                </div>
                {p.createdAt && (
                  <div className={styles.dateBadge}>
                    {new Date(p.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                )}
              </div>

              <div className={styles.content}>
                <h3 className={styles.projectTitle}>{p.libelle}</h3>
                <div className={styles.meta}>
                  <span>
                    {t("admin.projects.by")} <strong>{p.porteurNom}</strong>
                  </span>
                  {p.secteurNom && (
                    <span className={styles.secteurTag}>{p.secteurNom}</span>
                  )}
                </div>
                <p className={styles.location}>
                  📍 {p.localiteNom || "Non spécifié"}
                </p>

                <div className={styles.progress}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${Math.min(progression, 100)}%` }}
                    />
                  </div>
                  <span className={styles.progressPct}>
                    {progression.toFixed(0)}%
                  </span>
                </div>

                <div className={styles.financeValues}>
                  <strong>{format(p.montantCollecte, "XOF")}</strong>
                  <span className={styles.separator}>/</span>
                  {format(p.objectifFinancement, "XOF")}
                </div>

                <div className={styles.actions}>
                  <Link
                    to={`/admin/projets/detail/${p.id}`}
                    className={styles.btnDetail}
                    title="Voir"
                  >
                    <FiEye />
                  </Link>
                  <Link
                    to={`/admin/projets/edit/${p.slug || p.id}`}
                    className={styles.btnEdit}
                    title="Modifier"
                  >
                    <FiEdit />
                  </Link>
                  <button
                    onClick={() => handleSupprimer(p.id, p.libelle)}
                    className={styles.btnDelete}
                    title="Supprimer"
                  >
                    <FiTrash2 />
                  </button>
                </div>

                {(p.statutProjet === "SOUMIS" ||
                  p.statutProjet === "EN_ATTENTE") && (
                  <div className={styles.statusActions}>
                    <button
                      onClick={() => validerMutation.mutate(p.id)}
                      className={styles.btnValider}
                    >
                      <FiCheckCircle /> Valider
                    </button>
                    <button
                      onClick={() => rejeterMutation.mutate(p.id)}
                      className={styles.btnRejeter}
                    >
                      <FiXCircle /> Rejeter
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredProjets.length === 0 && (
        <div className={styles.emptyState}>
          Aucun projet ne correspond à vos critères.
        </div>
      )}
    </div>
  );
}
