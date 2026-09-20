import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "./leafletIconFix";
import styles from "./ProjectsMap.module.css";

export interface ProjectMapPoint {
  id: number;
  slug: string;
  libelle: string;
  latitude: number;
  longitude: number;
  localiteNom?: string;
}

interface ProjectsMapProps {
  points: ProjectMapPoint[];
  height?: number | string;
}

// Recentre/zoome automatiquement sur l'ensemble des marqueurs affichés —
// nécessaire à chaque changement de filtre (ex: changement de pays), car
// MapContainer ne recalcule pas ses bounds tout seul après son montage.
function FitBounds({ points }: { points: ProjectMapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 13);
      return;
    }
    const bounds = points.map(
      (p) => [p.latitude, p.longitude] as [number, number],
    );
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [points, map]);

  return null;
}

export default function ProjectsMap({ points, height = 480 }: ProjectsMapProps) {
  const defaultCenter: [number, number] =
    points.length > 0
      ? [points[0].latitude, points[0].longitude]
      : [7.539989, -5.54708]; // Centre approximatif Côte d'Ivoire, fallback

  return (
    <div className={styles.wrapper} style={{ height }}>
      <MapContainer
        center={defaultCenter}
        zoom={6}
        scrollWheelZoom
        style={{ height: "100%", width: "100%", borderRadius: "16px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {points.map((p) => (
          <Marker key={p.id} position={[p.latitude, p.longitude]}>
            <Popup>
              <strong>{p.libelle}</strong>
              {p.localiteNom && (
                <>
                  <br />
                  {p.localiteNom}
                </>
              )}
              <br />
              <Link to={`/projet/${p.slug}`}>Voir le projet</Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
