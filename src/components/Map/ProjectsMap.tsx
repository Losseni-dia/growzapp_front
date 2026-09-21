import { useEffect } from "react";
import {
  CircleMarker,
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
  distanceKm?: number;
}

interface ProjectsMapProps {
  points: ProjectMapPoint[];
  height?: number | string;
  userPosition?: { lat: number; lng: number };
}

// Recentre/zoome automatiquement sur l'ensemble des marqueurs affichés (et
// la position de l'utilisateur si fournie) — nécessaire à chaque
// changement de filtre (ex: changement de pays), car MapContainer ne
// recalcule pas ses bounds tout seul après son montage.
function FitBounds({
  points,
  userPosition,
}: {
  points: ProjectMapPoint[];
  userPosition?: { lat: number; lng: number };
}) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const bounds: [number, number][] = points.map(
      (p) => [p.latitude, p.longitude] as [number, number],
    );
    if (userPosition) bounds.push([userPosition.lat, userPosition.lng]);

    if (bounds.length === 0) return;
    if (bounds.length === 1) {
      map.setView(bounds[0], 13);
      return;
    }
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [points, userPosition, map]);

  return null;
}

export default function ProjectsMap({
  points,
  height = 480,
  userPosition,
}: ProjectsMapProps) {
  const defaultCenter: [number, number] = userPosition
    ? [userPosition.lat, userPosition.lng]
    : points.length > 0
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
        <FitBounds points={points} userPosition={userPosition} />
        {userPosition && (
          <CircleMarker
            center={[userPosition.lat, userPosition.lng]}
            radius={9}
            pathOptions={{
              color: "#1565C0",
              fillColor: "#42A5F5",
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Popup>Vous êtes ici</Popup>
          </CircleMarker>
        )}
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
              {p.distanceKm != null && (
                <>
                  <br />
                  {p.distanceKm.toFixed(1)} km
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
