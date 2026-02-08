import { useEffect, useState } from "react";
import { FiMapPin, FiNavigation, FiCompass } from "react-icons/fi";
import { useTranslation } from "react-i18next"; // Import pour les traductions
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
  const R = 6371; // Rayon de la Terre en km
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
  const { t } = useTranslation(); // Hook de traduction
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

  // Écran d'activation GPS (Empty State)
  if (!coords && !loading) {
    return (
      <div className={styles.emptyState}>
        <FiCompass className={styles.iconLarge} />
        <h3>{t("projets_proches.discover_title")}</h3>
        <p>{t("projets_proches.discover_text")}</p>
        <button onClick={getLocation} className={styles.btnActivate}>
          <FiNavigation /> {t("projets_proches.btn_activate")}
        </button>
        {error && <div className={styles.errorMessage}>⚠️ {error}</div>}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>
          <FiMapPin /> {t("projets_proches.title")}
        </h2>
      </div>

      <div className={styles.grid}>
        {loading && (
          <div className={styles.loaderContainer}>
            <div className={styles.radar}></div>
            <p>{t("projets_proches.scanning")}</p>
          </div>
        )}

        {!loading &&
          projets.map((p) => (
            <div key={p.id} className={styles.cardWrapper}>
              <div className={styles.distanceBadge}>
                <FiNavigation />
                <span>
                  {t("projets_proches.distance_prefix")}{" "}
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
                  target="_self" // Ouvre dans la même fenêtre
                  rel="noreferrer"
                  className={styles.gpsButton}
                >
                  <FiNavigation /> {t("projets_proches.gps_label")}
                </a>
              )}
            </div>
          ))}
      </div>

      {!loading && projets.length === 0 && coords && (
        <p className={styles.noProjectsText}>
          {t("projets_proches.no_projects")}
        </p>
      )}
    </div>
  );
};

export default ProjetsProches;
