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
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { api } from "../../../service/Api";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import styles from "./AdminProjetsList.module.css";

interface ProjetAdmin {
  id: number;
  slug: string; // ← ajouté pour navigation edit
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

export default function AdminProjetsList() {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("TOUS");

  const { data: projetsData, isLoading } = useQuery({
    queryKey: ["admin-projets"],
    queryFn: () => api.get<{ data: ProjetAdmin[] }>("/api/admin/projets"),
  });

  const projets = projetsData?.data || [];

  const filteredProjets = useMemo(() => {
    return projets.filter((p) => {
      const matchesTab = activeTab === "TOUS" || p.statutProjet === activeTab;
      const search = searchTerm.toLowerCase();
      const libelle = (p.libelle || "").toLowerCase();
      const porteurNom = (p.porteurNom || "").toLowerCase();
      const porteurPrenom = (p.porteurPrenom || "").toLowerCase();
      const secteurNom = (p.secteurNom || "").toLowerCase();
      const localiteNom = (p.localiteNom || "").toLowerCase();
      const dateCreation = p.createdAt || "";
      const matchesSearch =
        libelle.includes(search) ||
        porteurNom.includes(search) ||
        porteurPrenom.includes(search) ||
        secteurNom.includes(search) ||
        localiteNom.includes(search) ||
        dateCreation.includes(search);
      return matchesTab && matchesSearch;
    });
  }, [projets, searchTerm, activeTab]);

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

  if (isLoading)
    return <div className={styles.loading}>{t("dashboard.loading")}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.headerManagement}>
        <h1 className={styles.title}>
          {t("admin.dashboard.see_projects")} ({filteredProjets.length})
        </h1>
        <div className={styles.searchContainer}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Rechercher un nom, porteur, ville, secteur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

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
                projets.filter((p) => tab === "TOUS" || p.statutProjet === tab)
                  .length
              }
            </span>
          </button>
        ))}
      </div>

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
                  className={`${styles.statutBadge} ${styles[p.statutProjet?.toLowerCase()] || styles.badgeDefault}`}
                >
                  {p.statutProjet}
                </div>
              </div>

              <div className={styles.content}>
                <h3 className={styles.projectTitle}>{p.libelle}</h3>
                <p className={styles.porteur}>
                  {t("admin.projects.by")} {p.porteurNom}
                </p>
                <p className={styles.location}>
                  📍 {p.localiteNom || "Non spécifié"}
                </p>

                <div className={styles.progress}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${progression}%` }}
                    />
                  </div>
                  <span>{progression.toFixed(0)}%</span>
                </div>

                <div className={styles.financeValues}>
                  <strong>{format(p.montantCollecte, "XOF")}</strong> /{" "}
                  {format(p.objectifFinancement, "XOF")}
                </div>

                <div className={styles.actions}>
                  <Link
                    to={`/admin/projets/detail/${p.id}`}
                    className={styles.btnDetail}
                  >
                    <FiEye />
                  </Link>

                  {/* ← CORRIGÉ : utilise le slug au lieu de l'ID */}
                  <Link
                    to={`/admin/projets/edit/${p.slug || p.id}`}
                    className={styles.btnEdit}
                  >
                    <FiEdit />
                  </Link>

                  <button
                    onClick={() => handleSupprimer(p.id, p.libelle)}
                    className={styles.btnDelete}
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
