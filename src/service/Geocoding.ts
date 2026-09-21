// Géocodage inverse via Nominatim (OpenStreetMap) — gratuit, sans clé API.
// Politique d'usage : 1 requête/seconde max, usage non intensif uniquement
// (voir https://operations.osmfoundation.org/policies/nominatim/). Ici,
// déclenché uniquement sur une action explicite de l'admin (placer/déplacer
// un marqueur), jamais en boucle ou en continu — largement dans les clous.

export interface ReverseGeocodeResult {
  pays?: string;
  ville?: string;
  adresse?: string;
}

// Construit une adresse lisible même sans adressage formel (fréquent en
// zone rurale/périurbaine ouest-africaine) : à défaut de numéro+rue,
// retombe sur le quartier, puis la localité, puis le nom générique du lieu
// — Nominatim renvoie presque toujours quelque chose d'exploitable, même
// approximatif, plutôt que rien du tout.
function buildAdresse(address: Record<string, string>): string | undefined {
  const rue = [address.house_number, address.road].filter(Boolean).join(" ");
  const parts = [
    rue || undefined,
    address.suburb || address.neighbourhood || address.quarter,
    address.city || address.town || address.village || address.county,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : undefined;
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
    );
    if (!response.ok) return {};
    const data = await response.json();
    const address = data?.address || {};
    return {
      pays: address.country,
      ville: address.city || address.town || address.village || address.county,
      adresse: buildAdresse(address) || data?.display_name,
    };
  } catch {
    // Silencieux : le géocodage est une commodité, pas une dépendance
    // critique — l'admin garde toujours la main pour saisir manuellement.
    return {};
  }
}
