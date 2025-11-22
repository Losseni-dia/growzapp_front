// src/components/ProjectList/ProjectList.tsx
import { useState, useEffect } from "react";
import ProjectCard from "../../Projet/ProjetCard/ProjetCard";
import styles from "./ProjetList.module.css";
import { api } from "../../../service/api"; // ← LE SEUL IMPORT DONT TU AS BESOIN
import { ProjetDTO} from "../../../types"; // ← PageResponse pour la pagination si ton back en utilise

export default function ProjectList() {
  const [projects, setProjects] = useState<ProjetDTO[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchProjects = async () => {
    try {
      setLoading(true);

      // ON FORCE LE TYPE SCRIPT AVEC "as" → PLUS JAMAIS D'ERREUR
      const response = (await api.get("/api/projets")) as {
        success: boolean;
        data: ProjetDTO[];
      };

      setProjects(response.data || []);
    } catch (err) {
      console.error("Erreur chargement projets", err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  fetchProjects();
}, []);

  if (loading) {
    return <p className={styles.loading}>Chargement des projets en cours...</p>;
  }

  if (projects.length === 0) {
    return (
      <p className={styles.noProjects}>
        Aucun projet disponible pour le moment.
      </p>
    );
  }

  return (
    <div className={styles.grid}>
      {projects.map((projet) => (
        <ProjectCard key={projet.id} projet={projet} />
      ))}
    </div>
  );
}
