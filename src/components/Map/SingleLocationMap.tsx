import { MapContainer, Marker, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./leafletIconFix";
import styles from "./ProjectsMap.module.css";

interface SingleLocationMapProps {
  latitude: number;
  longitude: number;
  height?: number | string;
  zoom?: number;
}

// Carte simple, un seul marqueur, non-interactive (pas de clic pour
// déplacer) — utilisée pour afficher l'emplacement d'un projet déjà
// géolocalisé sur sa page de détail.
export default function SingleLocationMap({
  latitude,
  longitude,
  height = 320,
  zoom = 14,
}: SingleLocationMapProps) {
  return (
    <div className={styles.wrapper} style={{ height }}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", borderRadius: "16px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} />
      </MapContainer>
    </div>
  );
}
