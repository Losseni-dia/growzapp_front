import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  FiCheckCircle,
  FiEdit,
  FiEye,
  FiTrash2,
  FiXCircle,
  FiTrendingUp,
  FiX,
  FiArrowRight,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import { api, buildProjetUrl, buildFileUrl } from "../../../service/Api";
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
  const [activeTab, setActiveTab] = useState("TOUS");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [secteurFilter, setSecteurFilter] = useState("TOUS");

  const [projetARevaloriser, setProjetARevaloriser] =
    useState<ProjetAdmin | null>(null);
  const [nouvelleValorisation, setNouvelleValorisation] = useState("");
  const [motifRevalorisation, setMotifRevalorisation] = useState("");
  const [submittingRevalorisation, setSubmittingRevalorisation] =
    useState(false);

  const { data: projetsData, isLoading } = useQuery({
    queryKey: ["admin-projets", i18n.language],
    queryFn: () =>
      api.get<{ data: ProjetAdmin[] }>(buildProjetUrl("/api/admin/projets")),
  });

  const projets = projetsData?.data || [];

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

  const revaloriserMutation = useMutation({
    mutationFn: ({
      id,
      nouvelleValorisation,
      motif,
    }: {
      id: number;
      nouvelleValorisation: number;
      motif: string;
    }) =>
      api.patch(`/api/admin/projets/${id}/revaloriser`, {
        nouvelleValorisation,
        motif,
      }),
    onSuccess: () => {
      toast.success(t("admin.projects_list.revalorisation.toast_success"));
      queryClient.invalidateQueries({ queryKey: ["admin-projets"] });
      setProjetARevaloriser(null);
      setNouvelleValorisation("");
      setMotifRevalorisation("");
    },
    onError: () => {
      toast.error(t("admin.projects_list.revalorisation.toast_error"));
    },
  });

  const handleSupprimer = (id: number, libelle: string) => {
    if (window.confirm(t("admin.projects.confirm_delete", { name: libelle }))) {
      supprimerMutation.mutate(id);
    }
  };

  const openRevalorisation = (p: ProjetAdmin) => {
    setProjetARevaloriser(p);
    setNouvelleValorisation(p.valuation ? p.valuation.toString() : "");
    setMotifRevalorisation("");
  };

  const handleRevaloriser = () => {
    if (
      !projetARevaloriser ||
      !nouvelleValorisation ||
      parseFloat(nouvelleValorisation) <= 0
    ) {
      toast.error(t("admin.projects_list.revalorisation.toast_invalid"));
      return;
    }
    setSubmittingRevalorisation(true);
    revaloriserMutation.mutate(
      {
        id: projetARevaloriser.id,
        nouvelleValorisation: parseFloat(nouvelleValorisation),
        motif:
          motifRevalorisation ||
          t("admin.projects_list.revalorisation.reason_placeholder"),
      },
      { onSettled: () => setSubmittingRevalorisation(false) },
    );
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

  const nouvelleValorisationNum = parseFloat(nouvelleValorisation) || 0;
  const ancienneValorisation = projetARevaloriser?.valuation || 0;
  const deltaValorisation = nouvelleValorisationNum - ancienneValorisation;
  const deltaPositif = deltaValorisation >= 0;

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

      {/* ── FILTRES & TRI ─────────────────────────────────────────────────── */}
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
                    className={styles.btnDetail}
                    title={t("admin.projects.btn_view") as string}
                  >
                    <FiEye />
                  </Link>
                  <Link
                    to={`/admin/projets/edit/${p.slug || p.id}`}
                    className={styles.btnEdit}
                    title={t("admin.projects.btn_edit") as string}
                  >
                    <FiEdit />
                  </Link>
                  <button
                    onClick={() => openRevalorisation(p)}
                    className={styles.btnRevaloriser}
                    title={
                      t("admin.projects_list.revalorisation.tooltip") as string
                    }
                  >
                    <FiTrendingUp />
                  </button>
                  <button
                    onClick={() => handleSupprimer(p.id, p.libelle)}
                    className={styles.btnDelete}
                    title={t("admin.projects.btn_delete") as string}
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

      {/* ── MODAL REVALORISATION ─────────────────────────────────────────── */}
      {projetARevaloriser && (
        <div
          className={styles.modalOverlay}
          onClick={() => setProjetARevaloriser(null)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalAccent} />
            <div className={styles.modalHeader}>
              <div>
                <h2>{t("admin.projects_list.revalorisation.modal_title")}</h2>
                <p className={styles.modalProjetNom}>
                  {projetARevaloriser.libelleTradu ||
                    projetARevaloriser.libelle}
                </p>
              </div>
              <button
                className={styles.modalClose}
                onClick={() => setProjetARevaloriser(null)}
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Comparaison avant / après */}
            <div className={styles.valorisationCompare}>
              <div className={styles.compareBox}>
                <span className={styles.compareLabel}>
                  {t("admin.projects_list.revalorisation.current_label")}
                </span>
                <strong className={styles.compareValue}>
                  {format(ancienneValorisation, "XOF")}
                </strong>
              </div>
              <FiArrowRight size={18} className={styles.compareArrow} />
              <div
                className={`${styles.compareBox} ${styles.compareBoxNew} ${
                  nouvelleValorisationNum > 0
                    ? deltaPositif
                      ? styles.compareBoxPositive
                      : styles.compareBoxNegative
                    : ""
                }`}
              >
                <span className={styles.compareLabel}>
                  {t("admin.projects_list.revalorisation.new_label")}
                </span>
                <strong className={styles.compareValue}>
                  {nouvelleValorisationNum > 0
                    ? format(nouvelleValorisationNum, "XOF")
                    : "—"}
                </strong>
                {nouvelleValorisationNum > 0 && deltaValorisation !== 0 && (
                  <span className={styles.compareDelta}>
                    {deltaPositif ? "+" : ""}
                    {format(deltaValorisation, "XOF")}
                  </span>
                )}
              </div>
            </div>

            <label className={styles.modalLabel}>
              {t("admin.projects_list.revalorisation.new_label")}
            </label>
            <input
              type="number"
              className={styles.modalInput}
              placeholder={
                t(
                  "admin.projects_list.revalorisation.new_placeholder",
                ) as string
              }
              value={nouvelleValorisation}
              onChange={(e) => setNouvelleValorisation(e.target.value)}
              autoFocus
            />

            <label className={styles.modalLabel}>
              {t("admin.projects_list.revalorisation.reason_label")}
            </label>
            <input
              type="text"
              className={styles.modalInput}
              placeholder={
                t(
                  "admin.projects_list.revalorisation.reason_placeholder",
                ) as string
              }
              value={motifRevalorisation}
              onChange={(e) => setMotifRevalorisation(e.target.value)}
            />

            <p className={styles.modalHint}>
              {t("admin.projects_list.revalorisation.hint")}
            </p>

            <div className={styles.modalActions}>
              <button
                onClick={() => setProjetARevaloriser(null)}
                className={styles.btnCancel}
              >
                {t("admin.projects_list.revalorisation.cancel")}
              </button>
              <button
                onClick={handleRevaloriser}
                className={styles.btnConfirm}
                disabled={submittingRevalorisation}
              >
                {submittingRevalorisation
                  ? t("admin.projects_list.revalorisation.confirm_processing")
                  : t("admin.projects_list.revalorisation.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
