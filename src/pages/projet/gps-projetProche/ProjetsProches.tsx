import { useEffect, useMemo, useState } from "react";
import { FiGrid, FiMap, FiMapPin, FiNavigation, FiCompass } from "react-icons/fi";
import { useTranslation } from "react-i18next"; // Import pour les traductions
import ProjectsMap from "../../../components/Map/ProjectsMap";
import ProjectCard from "../../../components/Projet/ProjetCard/ProjetCard";
import { api, buildProjetUrl } from "../../../service/Api";
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
  const { coords, accuracy, error, getLocation } = useUserLocation();
  const [projets, setProjets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grille" | "carte">("grille");

  // Demande la position dès l'arrivée sur la page — plus besoin de cliquer
  // sur "Activer la géolocalisation" en plus du clic sur "Autour de moi"
  // dans le header. Le bouton reste affiché uniquement en cas d'échec
  // (refus, timeout) pour permettre de réessayer.
  useEffect(() => {
    getLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (coords) {
      setLoading(true);
      api
        .get<ApiResponse<any[]>>(
          buildProjetUrl(
               `/api/projets/proche-de-moi?lat=${coords.lat}&lon=${coords.lon}&rayon=100`,
           ),
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

  const mapPoints = useMemo(
    () =>
      projets
        .filter((p) => p.latitude != null && p.longitude != null)
        .map((p) => ({
          id: p.id,
          slug: p.slug,
          libelle: p.libelleTradu || p.libelle,
          latitude: p.latitude,
          longitude: p.longitude,
          localiteNom: p.localiteNom,
          distanceKm: coords
            ? parseFloat(
                getDistance(coords.lat, coords.lon, p.latitude, p.longitude),
              )
            : undefined,
        })),
    [projets, coords],
  );

  // En attente de la réponse du navigateur (popup d'autorisation en cours,
  // ou géolocalisation en train de résoudre) — pas encore d'erreur ni de
  // position : on ne montre pas le bouton "Activer", juste un indicateur.
  if (!coords && !loading && !error) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.radar}></div>
        <p>{t("projets_proches.requesting_location")}</p>
      </div>
    );
  }

  // Échec (refus, timeout, indisponible) — on propose de réessayer.
  if (!coords && !loading && error) {
    return (
      <div className={styles.emptyState}>
        <FiCompass className={styles.iconLarge} />
        <h3>{t("projets_proches.discover_title")}</h3>
        <p>{t("projets_proches.discover_text")}</p>
        <button onClick={getLocation} className={styles.btnActivate}>
          <FiNavigation /> {t("projets_proches.btn_activate")}
        </button>
        <div className={styles.errorMessage}>⚠️ {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>
          <FiMapPin /> {t("projets_proches.title")}
        </h2>
        <div className={styles.viewToggle}>
          <button
            className={viewMode === "grille" ? styles.viewToggleActive : ""}
            onClick={() => setViewMode("grille")}
          >
            <FiGrid size={16} /> {t("projects_page.view.grid")}
          </button>
          <button
            className={viewMode === "carte" ? styles.viewToggleActive : ""}
            onClick={() => setViewMode("carte")}
          >
            <FiMap size={16} /> {t("projects_page.view.map")}
          </button>
        </div>
      </div>

      {accuracy != null && accuracy > 5000 && (
        <p className={styles.accuracyWarning}>
          ⚠️ {t("projets_proches.low_accuracy", { km: (accuracy / 1000).toFixed(0) })}
        </p>
      )}

      {loading && (
        <div className={styles.loaderContainer}>
          <div className={styles.radar}></div>
          <p>{t("projets_proches.scanning")}</p>
        </div>
      )}

      {!loading && viewMode === "carte" && (
        <ProjectsMap
          points={mapPoints}
          height={520}
          userPosition={coords ? { lat: coords.lat, lng: coords.lon } : undefined}
        />
      )}

      {!loading && viewMode === "grille" && (
        <div className={styles.grid}>
          {projets.map((p) => (
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

              {p.adresse && (
                <p className={styles.addressText}>
                  <FiMapPin size={12} /> {p.adresse}
                </p>
              )}

              {p.googleMapsUrl && (
                <a
                  href={p.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.gpsButton}
                >
                  <FiNavigation /> {t("projets_proches.gps_label")}
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && projets.length === 0 && coords && (
        <p className={styles.noProjectsText}>
          {t("projets_proches.no_projects")}
        </p>
      )}
    </div>
  );
};

export default ProjetsProches;
