// Géocodage inverse via Nominatim (OpenStreetMap) — gratuit, sans clé API.
// Politique d'usage : 1 requête/seconde max, usage non intensif uniquement
// (voir https://operations.osmfoundation.org/policies/nominatim/). Ici,
// déclenché uniquement sur une action explicite de l'admin (placer/déplacer
// un marqueur), jamais en boucle ou en continu — largement dans les clous.

export interface ReverseGeocodeResult {
  pays?: string;
  ville?: string;
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
    );
    if (!response.ok) return {};
    const data = await response.json();
    const address = data?.address || {};
    return {
      pays: address.country,
      ville: address.city || address.town || address.village || address.county,
    };
  } catch {
    // Silencieux : le géocodage est une commodité, pas une dépendance
    // critique — l'admin garde toujours la main pour saisir manuellement.
    return {};
  }
}
