import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./leafletIconFix";
import styles from "./ProjectsMap.module.css";

interface LocationPickerMapProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  height?: number | string;
}

// Centre par défaut si aucune coordonnée n'est encore renseignée —
// Abidjan, Côte d'Ivoire (le porteur/admin zoome/clique pour ajuster).
const DEFAULT_CENTER: [number, number] = [5.359951, -4.008256];

// Leaflet calcule la taille de sa carte au moment du montage — si le
// conteneur n'a pas encore sa taille finale (mise en page pas terminée,
// onglet caché, StrictMode qui remonte le composant en dev...), les clics
// sont alors mal traduits en coordonnées, voire totalement ignorés. On
// force un recalcul juste après le montage pour éviter ce cas.
function InvalidateSizeOnMount() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function ClickHandler({
  onChange,
}: {
  onChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Carte interactive : cliquer place/déplace le marqueur, dont les
// coordonnées remontent au formulaire parent via onChange — permet de
// zoomer jusqu'à l'adresse exacte plutôt que de saisir des lat/lng à
// l'aveugle.
export default function LocationPickerMap({
  latitude,
  longitude,
  onChange,
  height = 360,
}: LocationPickerMapProps) {
  const hasPosition = latitude != null && longitude != null;
  const center = useMemo<[number, number]>(
    () => (hasPosition ? [latitude!, longitude!] : DEFAULT_CENTER),
    [hasPosition, latitude, longitude],
  );

  return (
    <div className={styles.wrapper} style={{ height }}>
      <MapContainer
        center={center}
        zoom={hasPosition ? 15 : 6}
        scrollWheelZoom
        style={{ height: "100%", width: "100%", borderRadius: "16px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <InvalidateSizeOnMount />
        <ClickHandler onChange={onChange} />
        {hasPosition && (
          <Marker
            position={[latitude!, longitude!]}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const pos = marker.getLatLng();
                onChange(pos.lat, pos.lng);
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
