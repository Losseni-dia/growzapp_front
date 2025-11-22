// src/pages/ProjetsPage/ProjetsPage.tsx → VERSION 100% FONCTIONNELLE
import { useState, useEffect } from "react";
import ProjectCard from "../../components/Projet/ProjetCard/ProjetCard";
import styles from "./ProjetsPage.module.css";
import { api } from "../../service/api";
import { ProjetDTO } from "../../types/projet";
import toast from "react-hot-toast";
import { ApiResponse } from "../../types/common";


export default function ProjetsPage() {
  const [projects, setProjects] = useState<ProjetDTO[]>([]);
  const [loading, setLoading] = useState(true);

  
useEffect(() => {
  const fetchProjects = async () => {
    try {
      setLoading(true);

      // CORRECTION FINALE – UN SEUL NIVEAU .data
      const response = await api.get<ApiResponse<ProjetDTO[]>>("/api/projets");

      setProjects(response.data || []);
    } catch (err: any) {
      console.error("Erreur chargement projets publics", err);
      toast.error("Impossible de charger les projets");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  fetchProjects();
}, []);

  if (loading) return <p className={styles.loading}>Chargement...</p>;

  if (projects.length === 0) {
    return (
      <div className={styles.noProjects}>
        <h2>Aucun projet validé pour le moment</h2>
        <p>Revenez bientôt !</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {projects.map((projet) => (
          <ProjectCard key={projet.id} projet={projet} />
        ))}
      </div>
    </div>
  );
}
