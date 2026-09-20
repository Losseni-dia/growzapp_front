// Leaflet calcule les URLs de ses icônes par défaut via des chemins relatifs
// qui ne survivent pas au bundling Vite — sans ce correctif, les marqueurs
// s'affichent comme des icônes cassées (404 sur marker-icon.png).
import L from "leaflet";

// new URL(..., import.meta.url) est résolu par Vite au build sans nécessiter
// de déclaration de module pour les imports .png (le projet n'en a pas).
const markerIcon2x = new URL(
  "leaflet/dist/images/marker-icon-2x.png",
  import.meta.url,
).href;
const markerIcon = new URL(
  "leaflet/dist/images/marker-icon.png",
  import.meta.url,
).href;
const markerShadow = new URL(
  "leaflet/dist/images/marker-shadow.png",
  import.meta.url,
).href;

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
