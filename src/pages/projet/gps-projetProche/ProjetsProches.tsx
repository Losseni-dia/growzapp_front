import { useEffect, useState } from "react";
import { FiMapPin, FiNavigation, FiCompass } from "react-icons/fi";
import ProjectCard from "../../../components/Projet/ProjetCard/ProjetCard";
import { api } from "../../../service/Api";
import { ApiResponse } from "../../../types/common";
import { useUserLocation } from "../../../service/HookGeoloc";
import styles from "./ProjetsProches.module.css";

// Calcul de distance Haversine
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
  const [projets, setProjets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

 useEffect(() => {
   if (coords) {
     setLoading(true);

     api
       .get<ApiResponse<any[]>>(
         `/api/projets/proche-de-moi?lat=${coords.lat}&lon=${coords.lon}&rayon=100`,
       )
       .then((res) => {
         // Avec ton fetch custom :
         // res est l'objet ApiResponse { success, message, data }
         // res.data est le tableau de projets any[]

         if (res && res.data) {
           const sorted = [...res.data].sort((a, b) => {
             const distA = parseFloat(
               getDistance(coords!.lat, coords!.lon, a.latitude, a.longitude),
             );
             const distB = parseFloat(
               getDistance(coords!.lat, coords!.lon, b.latitude, b.longitude),
             );
             return distA - distB;
           });
           setProjets(sorted);
         }
       })
       .catch((err) => {
         console.error("Erreur API Proximité :", err);
       })
       .finally(() => setLoading(false));
   }
 }, [coords]);

  // Écran d'activation GPS
  if (!coords && !loading) {
    return (
      <div className={styles.emptyState}>
        <FiCompass className={styles.icon} />
        <h3>Découvrir les projets autour de vous</h3>
        <p>
          Activez votre position pour voir les opportunités d'investissement à
          proximité.
        </p>
        <button onClick={getLocation} className={styles.btnActivate}>
          <FiNavigation /> Activer la géolocalisation
        </button>
        {error && <div className={styles.errorMessage}>⚠️ {error}</div>}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>
          <FiMapPin /> Projets à proximité
        </h2>
      </div>

      <div className={styles.grid}>
        {loading && (
          <div className={styles.radarContainer}>
            <div className={styles.radar}></div>
            <p>Scan des opportunités locales...</p>
          </div>
        )}

        {!loading &&
          projets.map((p) => (
            <div key={p.id} className={styles.cardWrapper}>
              <div className={styles.distanceBadge}>
                <FiNavigation />
                <span>
                  À{" "}
                  {getDistance(
                    coords!.lat,
                    coords!.lon,
                    p.latitude,
                    p.longitude,
                  )}{" "}
                  km
                </span>
              </div>

              <ProjectCard projet={p} />

              {p.googleMapsUrl && (
                <a
                  href={p.googleMapsUrl}
                  target="_self"
                  rel="noreferrer"
                  className={styles.gpsButton}
                >
                  Itinéraire GPS
                </a>
              )}
            </div>
          ))}
      </div>

      {!loading && projets.length === 0 && coords && (
        <p style={{ textAlign: "center", marginTop: "3rem", color: "#64748b" }}>
          Aucun projet trouvé dans un rayon de 100km.
        </p>
      )}
    </div>
  );
};

export default ProjetsProches;
