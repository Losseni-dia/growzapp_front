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

  const valider = useMutation({
    mutationFn: (id: number) => api.patch(`/admin/projets/${id}/valider`),
    onSuccess: () => {
      toast.success("Projet validé et publié !");
      queryClient.invalidateQueries({ queryKey: ["admin-projets"] });
    },
    onError: () => toast.error("Impossible de valider le projet"),
  });

  const supprimer = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/projets/${id}`),
    onSuccess: () => {
      toast.success("Projet supprimé");
      queryClient.invalidateQueries({ queryKey: ["admin-projets"] });
    },
    onError: () => toast.error("Erreur lors de la suppression"),
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

  const handleVoir = (id: number) => {
    window.open(`/projet/${id}`, "_blank");
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
          <p className={styles.empty}>Aucun projet pour le moment</p>
        ) : (
          projets.map((p) => (
            <div key={p.id} className={styles.card}>
              {/* POSTER — CORRIGÉ ET PROPRE */}
              <div className={styles.posterWrapper}>
                {p.poster ? (
                  <img
                    src={p.poster}
                    alt={p.libelle}
                    className={styles.poster}
                    loading="lazy"
                    key={p.id}
                    onError={(e) => {
                      console.log("Image échouée :", p.poster);
                      e.currentTarget.src =
                        "https://via.placeholder.com/400x300?text=No+Image";
                    }}
                  />
                ) : (
                  <div className={styles.noPoster}>Aucun poster</div>
                )}

                <div
                  className={`${styles.statutBadge} ${
                    p.statutProjet === "SOUMIS" ||
                    p.statutProjet === "EN_ATTENTE" ||
                    p.statutProjet === "EN_PREPARATION"
                      ? styles.badgeAttente
                      : p.statutProjet === "VALIDE"
                      ? styles.badgeValide
                      : p.statutProjet === "TERMINE"
                      ? styles.badgeTermine
                      : styles.badgeDefault
                  }`}
                >
                  {getStatutLabel(p.statutProjet)}
                </div>
              </div>

              <div className={styles.content}>
                <h3>{p.libelle}</h3>
                <p className={styles.porteur}>
                  Par {p.porteurNom || "Anonyme"}
                </p>

                <div className={styles.actions}>
                  {(p.statutProjet === "SOUMIS" ||
                    p.statutProjet === "EN_ATTENTE") && (
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
