import { useEffect, useState } from "react";
import { FiMapPin, FiNavigation, FiCompass } from "react-icons/fi";
import ProjectCard from "../../../components/Projet/ProjetCard/ProjetCard";
import { api } from "../../../service/Api";
import { ApiResponse } from "../../../types/common";
import { useUserLocation } from "../../../service/HookGeoloc";
import styles from "./ProjetsProches.module.css";

// 1. On déplace l'import en haut (était à l'intérieur du composant)
// import { ProjetDTO } from "../../types/projet";

const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return "N/A";
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
};

const ProjetsProches = () => {
  const { coords, error, getLocation } = useUserLocation();
  const [projets, setProjets] = useState<any[]>([]); // Typer idéalement avec ProjetDTO[]
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (coords) {
      setLoading(true);
      api
        .get<ApiResponse<any[]>>(
          `/api/projets/proche-de-moi?lat=${coords.lat}&lon=${coords.lon}&rayon=100`,
        )
        .then((res) => {
          // Tri optionnel : du plus proche au plus loin
          const sorted = res.data.data.sort((a, b) => {
            const distA = parseFloat(
              getDistance(coords.lat, coords.lon, a.latitude, a.longitude),
            );
            const distB = parseFloat(
              getDistance(coords.lat, coords.lon, b.latitude, b.longitude),
            );
            return distA - distB;
          });
          setProjets(sorted);
        })
        .catch((err: unknown) => {
          console.error("Erreur de récupération:", err);
        })
        .finally(() => setLoading(false));
    }
  }, [coords]);

  // État : Position non autorisée ou non activée
  if (!coords && !loading) {
    return (
      <div className={styles.emptyState}>
        <FiCompass className={styles.icon} />
        <h3>Découvrir les projets autour de vous</h3>
        <p>Activez votre position pour voir les opportunités à proximité.</p>
        <button onClick={getLocation} className={styles.btnActivate}>
          Activer la géolocalisation
        </button>
        {error && <span className={styles.errorMessage}>{error}</span>}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>
          <FiMapPin /> Projets à proximité
        </h2>
        {loading && <div className={styles.loader}>Recherche en cours...</div>}
      </div>

      <div className={styles.grid}>
        {projets.map((p) => (
          <div key={p.id} className={styles.cardWrapper}>
            {coords && p.latitude && p.longitude && (
              <div className={styles.distanceBadge}>
                <FiNavigation />
                <span>
                  À{" "}
                  {getDistance(coords.lat, coords.lon, p.latitude, p.longitude)}{" "}
                  km
                </span>
              </div>
            )}

            <ProjectCard projet={p} />

            {p.googleMapsUrl && (
              <a
                href={p.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.gpsButton}
              >
                Itinéraire GPS
              </a>
            )}
          </div>
        ))}
      </div>

      {!loading && projets.length === 0 && coords && (
        <p className={styles.noProjects}>
          Aucun projet trouvé dans un rayon de 100km.
        </p>
      )}
    </div>
  );
};

export default ProjetsProches;
