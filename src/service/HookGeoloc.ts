import { useState } from "react";

export const useUserLocation = () => {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        // Rayon d'incertitude en mètres renvoyé par le navigateur — un
        // ordinateur sans puce GPS retombe souvent sur une triangulation
        // Wi-Fi/IP nettement moins précise (parfois plusieurs dizaines de
        // km d'écart), contrairement à un smartphone. On le garde pour
        // prévenir l'utilisateur plutôt que de laisser croire que la
        // distance affichée est exacte au mètre près.
        setAccuracy(position.coords.accuracy);
        setError(null);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError("Accès à la position refusé.");
        } else if (err.code === err.TIMEOUT) {
          setError("La localisation a pris trop de temps. Réessayez.");
        } else {
          setError(
            "Position indisponible — vérifiez que la localisation est activée sur votre appareil.",
          );
        }
      },
      {
        // Demande explicitement la source la plus précise disponible
        // (GPS/Wi-Fi plutôt qu'IP) et interdit toute position mise en
        // cache par le système.
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  return { coords, accuracy, error, getLocation };
};
