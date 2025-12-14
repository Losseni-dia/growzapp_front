// src/pages/admin/AdminProjetsList.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../../../service/api";
import toast from "react-hot-toast";
import styles from "./AdminProjetsList.module.css";
import { useTranslation } from "react-i18next";
import {
  FiEdit,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiTrash2,
} from "react-icons/fi";

interface ProjetAdmin {
  id: number;
  libelle: string;
  statutProjet: string;
  porteurPrenom?: string;
  porteurNom: string;
  poster?: string;
  montantCollecte: number;
  objectifFinancement: number;
}

export default function AdminProjetsList() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: projetsData, isLoading } = useQuery({
    queryKey: ["admin-projets"],
    queryFn: () => api.get<{ data: ProjetAdmin[] }>("/api/admin/projets"),
  });

  const projets = projetsData?.data || [];

  // --- MUTATIONS ---

  const validerMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/api/admin/projets/${id}/valider`),
    onSuccess: () => {
      toast.success(t("admin.withdrawals.toast.validate_success"));
      queryClient.invalidateQueries({ queryKey: ["admin-projets"] });
    },
    onError: () => toast.error(t("admin.withdrawals.toast.error")),
  });

  const rejeterMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/api/admin/projets/${id}/rejeter`),
    onSuccess: () => {
      toast.success(t("admin.withdrawals.toast.reject_success"));
      queryClient.invalidateQueries({ queryKey: ["admin-projets"] });
    },
    onError: () => toast.error(t("admin.withdrawals.toast.error")),
  });

  const supprimerMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/projets/${id}`),
    onSuccess: () => {
      toast.success(t("admin.roles.success")); // Message "Succès" générique
      queryClient.invalidateQueries({ queryKey: ["admin-projets"] });
    },
    onError: () => toast.error(t("admin.withdrawals.toast.error")),
  });

  // --- ACTIONS ---

  const handleSupprimer = (id: number, libelle: string) => {
    if (window.confirm(t("admin.projects.confirm_delete", { name: libelle }))) {
      supprimerMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>{t("dashboard.loading")}</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        {t("admin.projects.title", { count: projets.length })}
      </h1>

      <div className={styles.grid}>
        {projets.map((p) => {
          const progression =
            p.objectifFinancement > 0
              ? (p.montantCollecte / p.objectifFinancement) * 100
              : 0;

          return (
            <div key={p.id} className={styles.card}>
              {/* HEADER : IMAGE + BADGE */}
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
                  className={`${styles.statutBadge} ${
                    styles[p.statutProjet?.toLowerCase()] || styles.badgeDefault
                  }`}
                >
                  {p.statutProjet}
                </div>
              </div>

              {/* CONTENU */}
              <div className={styles.content}>
                <h3 className={styles.projectTitle}>{p.libelle}</h3>
                <p className={styles.porteur}>
                  {t("admin.projects.by")} {p.porteurPrenom || ""}{" "}
                  {p.porteurNom}
                </p>

                {/* PROGRESSION */}
                <div className={styles.progress}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${progression}%` }}
                    />
                  </div>
                  <span>{progression.toFixed(0)}%</span>
                </div>

                {/* BOUTONS DE GESTION (Visibles pour tous les statuts) */}
                <div className={styles.actions}>
                  <Link
                    to={`/admin/projets/detail/${p.id}`}
                    className={styles.btnDetail}
                  >
                    <FiEye /> {t("admin.projects.btn_docs")}
                  </Link>

                  <Link
                    to={`/admin/projets/edit/${p.id}`}
                    className={styles.btnEdit}
                  >
                    <FiEdit /> {t("admin.projects.btn_edit")}
                  </Link>

                  <button
                    onClick={() => handleSupprimer(p.id, p.libelle)}
                    className={styles.btnDelete}
                    disabled={supprimerMutation.isPending}
                  >
                    <FiTrash2 /> {t("admin.projects.btn_delete")}
                  </button>
                </div>

                {/* BOUTONS DE VALIDATION (Uniquement si en attente) */}
                {(p.statutProjet === "SOUMIS" ||
                  p.statutProjet === "EN_ATTENTE") && (
                  <div className={styles.statusActions}>
                    <button
                      onClick={() => validerMutation.mutate(p.id)}
                      className={styles.btnValider}
                      disabled={validerMutation.isPending}
                    >
                      <FiCheckCircle /> {t("admin.projects.btn_validate")}
                    </button>
                    <button
                      onClick={() => rejeterMutation.mutate(p.id)}
                      className={styles.btnRejeter}
                      disabled={rejeterMutation.isPending}
                    >
                      <FiXCircle /> {t("admin.projects.btn_reject")}
                    </button>
                  </div>
                )}

                {/* LIEN PUBLIC */}
                <Link
                  to={`/projet/${p.id}`}
                  target="_blank"
                  className={styles.btnPublic}
                >
                  {t("admin.projects.btn_public")}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
