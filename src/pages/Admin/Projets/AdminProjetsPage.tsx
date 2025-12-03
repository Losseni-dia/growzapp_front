// src/pages/admin/AdminProjetsPage.tsx
// VERSION ULTIME — AVEC TOUS LES BOUTONS (Voir Admin Detail, Modifier, Supprimer)

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../../../service/api";
import toast from "react-hot-toast";
import styles from "./AdminProjetsPage.module.css";
import {
  FiDollarSign,
  FiEdit,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiTrash2,
} from "react-icons/fi";

interface ProjetAdmin {
  id: number;
  libelle: string;
  description?: string;
  statutProjet: string;
  porteurNom: string;
  porteurPrenom?: string;
  poster?: string;
  montantCollecte: number;
}

export default function AdminProjetsPage() {
  const {
    data: projetsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-projets"],
    queryFn: () => api.get<{ data: ProjetAdmin[] }>("/api/admin/projets"),
  });

  const projets = projetsData?.data || [];

  const { data: soldesData = {} } = useQuery({
    queryKey: ["project-soldes"],
    queryFn: async () => {
      const soldes: Record<number, number> = {};
      for (const p of projets) {
        try {
          const res = await api.get(`/api/admin/projet-wallet/${p.id}/solde`);
          soldes[p.id] = Number(res) || 0;
        } catch {
          soldes[p.id] = 0;
        }
      }
      return soldes;
    },
    enabled: projets.length > 0,
  });

  // === SUPPRESSION D'UN PROJET ===
  const handleDelete = async (projetId: number, libelle: string) => {
    if (
      !window.confirm(
        `Supprimer définitivement le projet "${libelle}" ? Cette action est irréversible.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/api/admin/projets/${projetId}`);
      toast.success("Projet supprimé avec succès");
      refetch(); // Recharge la liste
    } catch (err: any) {
      toast.error(err.message || "Impossible de supprimer le projet");
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
          const soldeReel = soldesData[p.id] ?? 0;

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

                <div className={styles.tresorerie}>
                  <FiDollarSign className={styles.tresorerieIcon} />
                  <div>
                    <strong
                      className={
                        soldeReel > 0 ? styles.soldePositif : styles.soldeZero
                      }
                    >
                      {soldeReel.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      €
                    </strong>
                    <small>séquestré réel</small>
                  </div>
                </div>

                {/* BOUTONS ADMIN — TOUS ALIGNÉS */}
                <div className={styles.adminActions}>
                  {/* VOIR LES DOCUMENTS (nouvelle page) */}
                  <Link
                    to={`/admin/projets/detail/${p.id}`}
                    className={styles.btnVoirDetail}
                  >
                    <FiEye /> Documents
                  </Link>

                  {/* MODIFIER */}
                  <Link
                    to={`/admin/projets/edit/${p.id}`}
                    className={styles.btnModifier}
                  >
                    <FiEdit /> Modifier
                  </Link>

                  {/* SUPPRIMER */}
                  <button
                    onClick={() => handleDelete(p.id, p.libelle)}
                    className={styles.btnSupprimer}
                  >
                    <FiTrash2 /> Supprimer
                  </button>
                </div>

                {/* Autres actions */}
                <div className={styles.adminActions}>
                  {p.statutProjet === "SOUMIS" ||
                  p.statutProjet === "EN_ATTENTE" ? (
                    <>
                      <button className={styles.btnValider}>
                        <FiCheckCircle /> Valider
                      </button>
                      <button className={styles.btnRejeter}>
                        <FiXCircle /> Rejeter
                      </button>
                    </>
                  ) : null}

                  <Link
                    to={`/admin/project-wallets/${p.id}`}
                    className={styles.btnPortefeuille}
                  >
                    Portefeuille projet
                  </Link>
                </div>

                <Link
                  to={`/projet/${p.id}`}
                  target="_blank"
                  className={styles.btnVoirPublic}
                >
                  Voir le projet (public)
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
