import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  FiCheckCircle,
  FiXCircle,
  FiTrash2,
  FiRotateCcw,
  FiAlertTriangle,
} from "react-icons/fi";
import { Link, useSearchParams } from "react-router-dom";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import { api, buildFileUrl, buildProjetUrl } from "../../../service/Api";
import styles from "./AdminProjetsList.module.css";

interface ProjetAdmin {
  id: number;
  slug: string;
  libelle: string;
  libelleTradu?: string;
  statutProjet: string;
  porteurPrenom?: string;
  porteurNom: string;
  poster?: string;
  montantCollecte: number;
  objectifFinancement: number;
  valuation: number;
  secteurNom?: string;
  localiteNom?: string;
  createdAt?: string;
  documentsEnAttente?: number;
}

type SortKey = "recent" | "ancien" | "collecte" | "objectif";

export default function AdminProjetsList() {
  const { t, i18n } = useTranslation();
  const { format } = useCurrency();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    initialTab && ["TOUS", "SOUMIS", "VALIDE", "REJETE"].includes(initialTab)
      ? initialTab
      : "TOUS",
  );
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [secteurFilter, setSecteurFilter] = useState("TOUS");
  const [viewMode, setViewMode] = useState<"active" | "corbeille">("active");

  const { data: projetsData, isLoading } = useQuery({
    queryKey: ["admin-projets", i18n.language, viewMode],
    queryFn: () =>
      api.get<{ data: ProjetAdmin[] }>(
        buildProjetUrl(
          viewMode === "active"
            ? "/api/admin/projets"
            : "/api/admin/projets/corbeille",
        ),
      ),
  });

  const projets = projetsData?.data || [];

  const { data: corbeilleCountData } = useQuery({
    queryKey: ["admin-projets-corbeille-count"],
    queryFn: () =>
      api.get<{ data: ProjetAdmin[] }>(
        buildProjetUrl("/api/admin/projets/corbeille"),
      ),
  });
  const corbeilleCount = corbeilleCountData?.data.length ?? 0;

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
      queryClient.invalidateQueries({ queryKey: ["admin-projets-corbeille-count"] });
    },
  });

  const rejeterMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/api/admin/projets/${id}/rejeter`),
    onSuccess: () => {
      toast.success(t("admin.withdrawals.toast.reject_success"));
      queryClient.invalidateQueries({ queryKey: ["admin-projets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-projets-corbeille-count"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, motif }: { id: number; motif: string }) => {
      const params = new URLSearchParams();
      if (motif) params.set("motif", motif);
      return api.delete(`/api/admin/projets/${id}?${params}`);
    },
    onSuccess: () => {
      toast.success("Projet déplacé dans la corbeille");
      queryClient.invalidateQueries({ queryKey: ["admin-projets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-projets-corbeille-count"] });
    },
    onError: (err: any) => toast.error(err.message || "Erreur"),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => api.post(`/api/admin/projets/${id}/restaurer`),
    onSuccess: () => {
      toast.success("Projet restauré");
      queryClient.invalidateQueries({ queryKey: ["admin-projets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-projets-corbeille-count"] });
    },
    onError: (err: any) => toast.error(err.message || "Erreur"),
  });

  const purgeMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/projets/${id}/purger`),
    onSuccess: () => {
      toast.success("Projet supprimé définitivement");
      queryClient.invalidateQueries({ queryKey: ["admin-projets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-projets-corbeille-count"] });
    },
    onError: (err: any) => toast.error(err.message || "Erreur"),
  });

  const handleDelete = (p: ProjetAdmin) => {
    if (!window.confirm(`Déplacer « ${p.libelle} » dans la corbeille ?`)) return;
    const motif = window.prompt("Motif de suppression (facultatif) :") || "";
    deleteMutation.mutate({ id: p.id, motif });
  };

  const handlePurge = (p: ProjetAdmin) => {
    const confirmText = window.prompt(
      `Action irréversible. Tapez "${p.libelle}" pour confirmer la suppression définitive :`,
    );
    if (confirmText !== p.libelle) {
      if (confirmText !== null) toast.error("Confirmation invalide");
      return;
    }
    purgeMutation.mutate(p.id);
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

  const getStatutLabel = (statut: string) => {
    const key = `admin.projects_list.status.${statut?.toUpperCase()}`;
    return t(key, { defaultValue: statut });
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

        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder={t("admin.projects_list.search_placeholder") as string}
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

      {/* ── ONGLETS ACTIFS / CORBEILLE ──────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => setViewMode("active")}
          className={`${styles.tabButton} ${viewMode === "active" ? styles.activeTab : ""}`}
        >
          Actifs
        </button>
        <button
          type="button"
          onClick={() => setViewMode("corbeille")}
          className={`${styles.tabButton} ${viewMode === "corbeille" ? styles.activeTab : ""}`}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <FiTrash2 size={14} /> Corbeille
          {corbeilleCount > 0 && (
            <span
              style={{
                background: viewMode === "corbeille" ? "#fff" : "#b45309",
                color: viewMode === "corbeille" ? "#b45309" : "#fff",
                borderRadius: "999px",
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "1px 7px",
                marginLeft: 4,
              }}
            >
              {corbeilleCount}
            </span>
          )}
        </button>
      </div>

      {/* ── FILTRES & TRI ─────────────────────────────────────────────────── */}
      {viewMode === "active" && (
      <div className={styles.filtersBar}>
        <div className={styles.tabsWrapper}>
          {["TOUS", "SOUMIS", "VALIDE", "REJETE"].map((tab) => (
            <button
              key={tab}
              className={`${styles.tabButton} ${activeTab === tab ? styles.activeTab : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {getStatutLabel(tab)}
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

        <div className={styles.sortBar}>
          <select
            className={styles.select}
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="recent">
              {t("admin.projects_list.sort.recent")}
            </option>
            <option value="ancien">
              {t("admin.projects_list.sort.ancien")}
            </option>
            <option value="collecte">
              {t("admin.projects_list.sort.collecte")}
            </option>
            <option value="objectif">
              {t("admin.projects_list.sort.objectif")}
            </option>
          </select>

          <select
            className={styles.select}
            value={secteurFilter}
            onChange={(e) => setSecteurFilter(e.target.value)}
          >
            {secteurs.map((s) => (
              <option key={s} value={s}>
                {s === "TOUS" ? t("admin.projects_list.all_sectors") : s}
              </option>
            ))}
          </select>
        </div>
      </div>
      )}

      {/* ── GRILLE ───────────────────────────────────────────────────────── */}
      <div className={styles.grid}>
        {filteredProjets.map((p) => {
          const progression =
            p.objectifFinancement > 0
              ? (p.montantCollecte / p.objectifFinancement) * 100
              : 0;
          const libelleAffiche = p.libelleTradu || p.libelle;

          return (
            <div key={p.id} className={styles.card}>
              <div className={styles.cardAccent} />
              {!!p.documentsEnAttente && p.documentsEnAttente > 0 && (
                <div
                  title={`${p.documentsEnAttente} document(s) en attente de validation`}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: "#f59e0b",
                    color: "white",
                    borderRadius: "999px",
                    padding: "2px 8px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    zIndex: 2,
                  }}
                >
                  📄 {p.documentsEnAttente}
                </div>
              )}
              <div className={styles.posterWrapper}>
                {p.poster ? (
                  <img
                    src={buildFileUrl(p.poster)}
                    alt={libelleAffiche}
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
                  {getStatutLabel(p.statutProjet)}
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
                <h3 className={styles.projectTitle}>{libelleAffiche}</h3>
                <div className={styles.meta}>
                  <span>
                    {t("admin.projects.by")} <strong>{p.porteurNom}</strong>
                  </span>
                  {p.secteurNom && (
                    <span className={styles.secteurTag}>{p.secteurNom}</span>
                  )}
                </div>
                <p className={styles.location}>
                  📍 {p.localiteNom || t("common.not_provided")}
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

                {p.valuation > 0 && (
                  <div className={styles.valuationRow}>
                    <span>
                      {t(
                        "admin.projects_list.revalorisation.card_valuation_label",
                      )}
                    </span>
                    <strong>{format(p.valuation, "XOF")}</strong>
                  </div>
                )}

                <div className={styles.actions}>
                  <Link
                    to={`/admin/projets/detail/${p.id}`}
                    className={styles.btnAdminister}
                  >
                    {t("admin.projects.btn_administer")}
                  </Link>
                </div>

                {viewMode === "active" &&
                  (p.statutProjet === "SOUMIS" ||
                    p.statutProjet === "EN_ATTENTE") && (
                  <div className={styles.statusActions}>
                    <button
                      onClick={() => validerMutation.mutate(p.id)}
                      className={styles.btnValider}
                    >
                      <FiCheckCircle /> {t("admin.projects.btn_validate")}
                    </button>
                    <button
                      onClick={() => rejeterMutation.mutate(p.id)}
                      className={styles.btnRejeter}
                    >
                      <FiXCircle /> {t("admin.projects.btn_reject")}
                    </button>
                  </div>
                )}

                {viewMode === "active" ? (
                  <div className={styles.statusActions}>
                    <button
                      onClick={() => handleDelete(p)}
                      className={styles.btnRejeter}
                    >
                      <FiTrash2 /> Supprimer
                    </button>
                  </div>
                ) : (
                  <div className={styles.statusActions}>
                    <button
                      onClick={() => restoreMutation.mutate(p.id)}
                      className={styles.btnValider}
                    >
                      <FiRotateCcw /> Restaurer
                    </button>
                    <button
                      onClick={() => handlePurge(p)}
                      className={styles.btnRejeter}
                    >
                      <FiAlertTriangle /> Purger
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
          {t("admin.projects_list.empty")}
        </div>
      )}
    </div>
  );
}
