// src/pages/admin/ProjetsAdminPage.tsx

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../service/api";
import { ProjetDTO } from "../../../types/projet";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import styles from "./AdminProjetsPage.module.css";

export default function ProjetsAdminPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-projets"],
    queryFn: async () => (await api.get<any>("/admin/projets")).data || [],
  });

  const projets: ProjetDTO[] = data || [];

  // Fonction propre pour afficher le bon libellé dans l'admin
  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case "SOUMIS":
      case "EN_ATTENTE":
      case "EN_PREPARATION":
        return "En attente";
      case "VALIDE":
        return "Financement en cours";
      case "REJETE":
        return "Rejeté";
      case "EN_COURS":
        return "En cours";
      case "TERMINE":
        return "Financement terminé";
      default:
        return statut;
    }
  };

  // Mutation pour valider un projet
  const valider = useMutation({
    mutationFn: (id: number) => api.patch(`/api/admin/projets/${id}/valider`), // CORRIGÉ : / au début
    onSuccess: () => {
      toast.success("Projet validé et publié !");
      queryClient.invalidateQueries({ queryKey: ["admin-projets"] });
    },
    onError: (error: any) => {
      console.error("Erreur validation:", error);
      toast.error("Impossible de valider le projet");
    },
  });

  // Mutation pour supprimer
  const supprimer = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/projets/${id}`),
    onSuccess: () => {
      toast.success("Projet supprimé");
      queryClient.invalidateQueries({ queryKey: ["admin-projets"] });
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  const handleValider = (id: number) => {
    if (confirm("Valider ce projet ? Il sera visible publiquement.")) {
      valider.mutate(id);
    }
  };

  const handleSupprimer = (id: number) => {
    if (confirm("Supprimer définitivement ce projet ?")) {
      supprimer.mutate(id);
    }
  };

  const handleModifier = (id: number) => {
    navigate(`/admin/projets/edit/${id}`);
  };

  const handleVoir = async (id: number) => {
    try {
      await api.get(`/projets/${id}`);
      window.open(`/projet/${id}`, "_blank");
    } catch (err: any) {
      if (
        err.message.includes("AccessDenied") ||
        err.message.includes("publié")
      ) {
        toast.error("Ce projet n'est pas encore publié publiquement");
      } else {
        toast.error("Impossible d'ouvrir le détail");
      }
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Chargement des projets...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Administration des projets ({projets.length})
      </h1>

      <div className={styles.header}>
        <div />
        <button
          onClick={() => navigate("/admin/projets/create")}
          className={styles.createBtn}
        >
          + Créer un projet
        </button>
      </div>

      <div className={styles.grid}>
        {projets.length === 0 ? (
          <p
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              fontSize: "1.8rem",
              color: "#1B5E20",
              marginTop: "4rem",
            }}
          >
            Aucun projet pour le moment
          </p>
        ) : (
          projets.map((p) => (
            <div key={p.id} className={styles.card}>
              {/* Image + Badge statut */}
              {p.poster ? (
                <>
                  <img
                    src={p.poster}
                    alt={p.libelle}
                    className={styles.poster}
                  />
                  <div
                    className={styles.statutBadge}
                    data-status={p.statutProjet}
                  >
                    {getStatutLabel(p.statutProjet)}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    height: "200px",
                    background: "#f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#999",
                    fontSize: "1.2rem",
                  }}
                >
                  Pas d'image
                </div>
              )}

              {/* Contenu */}
              <div style={{ padding: "1.5rem", flexGrow: 1 }}>
                <h3>{p.libelle}</h3>
                <p>Par {p.porteurNom || "Anonyme"}</p>

                <div className={styles.actions}>
                  {p.statutProjet === "SOUMIS" && (
                    <button
                      onClick={() => handleValider(p.id)}
                      className={styles.btnValider}
                      disabled={valider.isPending}
                    >
                      {valider.isPending ? "Validation..." : "Valider"}
                    </button>
                  )}
                  <button
                    onClick={() => handleModifier(p.id)}
                    className={styles.btnModifier}
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleSupprimer(p.id)}
                    className={styles.btnSupprimer}
                    disabled={supprimer.isPending}
                  >
                    {supprimer.isPending ? "Suppression..." : "Supprimer"}
                  </button>
                  <button
                    onClick={() => handleVoir(p.id)}
                    className={styles.btnVoir}
                  >
                    Voir détail
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
