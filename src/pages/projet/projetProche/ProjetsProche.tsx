import { useEffect, useState } from "react";
import { FiMapPin, FiNavigation } from "react-icons/fi";
import ProjectCard from "../../../components/Projet/ProjetCard/ProjetCard";
import { api } from "../../../service/Api";
import { useUserLocation } from ".././../../service/HookGeoloc";
import styles from "./ProjetsProches.module.css";

const ProjetsProches = () => {
  const { coords, error, getLocation } = useUserLocation();
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (coords) {
      setLoading(true);
      api
        .get(
          `/api/projets/proche-de-moi?lat=${coords.lat}&lon=${coords.lon}&rayon=100`,
        )
        .then((res) => setProjets(res.data.data))
        .finally(() => setLoading(false));
    }
  }, [coords]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>
          <FiMapPin /> Projets à proximité
        </h2>
        {!coords && (
          <button onClick={getLocation} className={styles.btnLocation}>
            <FiNavigation /> Trouver les projets autour de moi
          </button>
        )}
      </div>

      {loading && <p>Analyse de votre zone géographique...</p>}

      <div className={styles.projectGrid}>
        {projets.map((p: any) => (
          <div key={p.id} className={styles.cardWrapper}>
            <ProjectCard projet={p} />
            {/* BOUTON GPS NEW LOOK */}
            {p.googleMapsUrl && (
              <a
                href={p.googleMapsUrl}
                target="_blank"
                className={styles.gpsLink}
              >
                S'y rendre avec GPS
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjetsProches;
