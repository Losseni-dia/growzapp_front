// src/pages/admin/AdminProjetsList.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../../../service/api";
import toast from "react-hot-toast";
import styles from "./AdminProjetsList.module.css";
import {
  FiDollarSign,
  FiEdit,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiTrash2,
  FiAlertCircle,
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
  const queryClient = useQueryClient();

  const { data: projetsData, isLoading } = useQuery({
    queryKey: ["admin-projets"],
    queryFn: () => api.get<{ data: ProjetAdmin[] }>("/api/admin/projets"),
  });

  const projets = projetsData?.data || [];

  // Mutations
  const validerMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/api/admin/projets/${id}/valider`),
    onSuccess: () => {
      toast.success("Projet validé !");
      queryClient.invalidateQueries({ queryKey: ["admin-projets"] });
    },
    onError: () => toast.error("Échec de la validation"),
  });

  const rejeterMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/api/admin/projets/${id}/rejeter`),
    onSuccess: () => {
      toast.success("Projet rejeté");
      queryClient.invalidateQueries({ queryKey: ["admin-projets"] });
    },
    onError: () => toast.error("Échec du rejet"),
  });

  const supprimerMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/projets/${id}`),
    onSuccess: () => {
      toast.success("Projet supprimé définitivement");
      queryClient.invalidateQueries({ queryKey: ["admin-projets"] });
    },
    onError: () => toast.error("Impossible de supprimer"),
  });

  const handleSupprimer = (id: number, libelle: string) => {
    if (
      window.confirm(
        `Supprimer définitivement "${libelle}" ? Cette action est irréversible.`
      )
    ) {
      supprimerMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Chargement des projets...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Administration des Projets ({projets.length})
      </h1>

      <div className={styles.grid}>
        {projets.map((p) => {
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
                  <div className={styles.noPoster}>Aucun poster</div>
                )}
                <div
                  className={`${styles.statutBadge} ${
                    styles[p.statutProjet?.toLowerCase()] || styles.badgeDefault
                  }`}
                >
                  {p.statutProjet}
                </div>
              </div>

              <div className={styles.content}>
                <h3 className={styles.projectTitle}>{p.libelle}</h3>
                <p className={styles.porteur}>
                  Par {p.porteurPrenom || ""} {p.porteurNom}
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

                {/* ACTIONS PRINCIPALES */}
                <div className={styles.actions}>
                  {/* Voir les documents */}
                  <Link
                    to={`/admin/projets/detail/${p.id}`}
                    className={styles.btnDetail}
                  >
                    <FiEye /> Documents
                  </Link>

                  {/* Modifier */}
                  <Link
                    to={`/admin/projets/edit/${p.id}`}
                    className={styles.btnEdit}
                  >
                    <FiEdit /> Modifier
                  </Link>

                  {/* Supprimer */}
                  <button
                    onClick={() => handleSupprimer(p.id, p.libelle)}
                    className={styles.btnDelete}
                    disabled={supprimerMutation.isPending}
                  >
                    <FiTrash2 /> Supprimer
                  </button>
                </div>

                {/* ACTIONS STATUT */}
                {(p.statutProjet === "SOUMIS" ||
                  p.statutProjet === "EN_ATTENTE") && (
                  <div className={styles.statusActions}>
                    <button
                      onClick={() => validerMutation.mutate(p.id)}
                      className={styles.btnValider}
                      disabled={validerMutation.isPending}
                    >
                      <FiCheckCircle /> Valider
                    </button>
                    <button
                      onClick={() => rejeterMutation.mutate(p.id)}
                      className={styles.btnRejeter}
                      disabled={rejeterMutation.isPending}
                    >
                      <FiXCircle /> Rejeter
                    </button>
                  </div>
                )}

                {/* Voir public */}
                <Link
                  to={`/projet/${p.id}`}
                  target="_blank"
                  className={styles.btnPublic}
                >
                  Voir en public
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
