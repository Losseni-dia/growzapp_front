// src/pages/admin/ProjetsAdminPage.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../service/api";
import { ProjetDTO } from "../../../types/projet";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiCheck, FiEdit, FiTrash2, FiEye } from "react-icons/fi";
import styles from "./AdminProjetsPage.module.css";

export default function ProjetsAdminPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-projets"],
    queryFn: async () => (await api.get<any>("/admin/projets")).data || [],
  });

  const projets: ProjetDTO[] = data || [];

  // Mutations
  const valider = useMutation({
    mutationFn: (id: number) => api.patch(`/admin/projets/${id}/valider`),
    onSuccess: () => {
      toast.success("Projet validé et publié !");
      queryClient.invalidateQueries({ queryKey: ["admin-projets"] });
    },
  });

  const supprimer = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/projets/${id}`),
    onSuccess: () => {
      toast.success("Projet supprimé");
      queryClient.invalidateQueries({ queryKey: ["admin-projets"] });
    },
  });

  const handleValider = (id: number) => {
    if (confirm("Valider ce projet ? Il sera visible publiquement."))
      valider.mutate(id);
  };

  const handleSupprimer = (id: number) => {
    if (confirm("Supprimer définitivement ce projet ?")) supprimer.mutate(id);
  };

  // → MODIFIER : va vers la page d'édition admin (qui utilise PUT multipart)
 const handleModifier = (id: number) => {
   navigate(`/admin/projets/edit/${id}`); // ← Cette route doit pointer vers ProjectForm en mode edit
 };

  // → VOIR : appelle l'endpoint public sécurisé (GetMapping("/{id}"))
  const handleVoir = async (id: number) => {
    try {
      const res = await api.get(`/projets/${id}`); // ← Ton endpoint sécurisé
      // Si ça passe → ouvre le détail public
      window.open(`/projet/${id}`);
    } catch (err: any) {
      if (
        err.message.includes("AccessDenied") ||
        err.message.includes("n'est pas encore publié")
      ) {
        toast.error("Ce projet n'est pas encore publié publiquement");
      } else {
        toast.error("Impossible d'ouvrir le détail");
      }
    }
  };

  if (isLoading) return <div className={styles.loading}>Chargement...</div>;

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
              {p.poster ? (
                <>
                  <img
                    src={p.poster}
                    alt={p.libelle}
                    className={styles.poster}
                  />
                  <div className={styles.statutBadge}>
                    {p.statutProjet === "SOUMIS" && "En attente"}
                    {p.statutProjet === "VALIDE" && "Validé"}
                    {p.statutProjet === "REJETE" && "Rejeté"}
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
                    color: "#aaa",
                  }}
                >
                  Pas d'image
                </div>
              )}

              <div style={{ padding: "1.5rem", flexGrow: 1 }}>
                <h3
                  style={{
                    margin: "0 0 0.5rem",
                    color: "#1B5E20",
                    fontSize: "1.4rem",
                  }}
                >
                  {p.libelle}
                </h3>
                <p style={{ margin: "0.5rem 0", color: "#444" }}>
                  Par {p.porteurNom || "Anonyme"}
                </p>

                <div className={styles.actions}>
                  {p.statutProjet === "SOUMIS" && (
                    <button
                      onClick={() => handleValider(p.id)}
                      className={styles.btnValider}
                    >
                      <FiCheck /> Valider
                    </button>
                  )}
                  <button
                    onClick={() => handleModifier(p.id)}
                    className={styles.btnModifier}
                  >
                    <FiEdit /> Modifier
                  </button>
                  <button
                    onClick={() => handleSupprimer(p.id)}
                    className={styles.btnSupprimer}
                  >
                    <FiTrash2 /> Supprimer
                  </button>
                  <button
                    onClick={() => handleVoir(p.id)}
                    className={styles.btnVoir}
                  >
                    <FiEye /> Voir détail
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
