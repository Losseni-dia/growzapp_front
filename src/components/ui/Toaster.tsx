// src/components/ui/GrowzToaster.tsx
import { Toaster } from "react-hot-toast";

export default function GrowzToaster() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      toastOptions={{
        // Durée par défaut pour tous les toasts
        duration: 5000,

        // Style global
        style: {
          background: "var(--growz-primary, #1B5E20)",
          color: "white",
          fontWeight: "bold",
          fontSize: "1rem",
          borderRadius: "12px",
          padding: "16px 24px",
          boxShadow: "0 8px 25px var(--growz-veil-30, rgba(27, 94, 32, 0.4))",
          border: "2px solid var(--growz-gold, #FFC107)",
        },

        // Style spécifique pour les succès
        success: {
          iconTheme: {
            primary: "var(--growz-gold, #FFC107)",
            secondary: "var(--growz-primary, #1B5E20)",
          },
        },

        // Style spécifique pour les erreurs
        error: {
          style: {
            background: "#b71c1c",
            border: "2px solid #ef9a9a",
          },
        },

        // Optionnel : style pour les loading (spinner)
        loading: {
          style: {
            background: "#0d47a1",
            border: "2px solid #64b5f6",
          },
        },

        // Si tu utilises parfois toast("message") sans type → il prendra le style par défaut
        // Tu peux ajouter un style "default" si tu veux (non officiel mais fonctionne)
        // default: { ... } n’existe pas non plus, donc on garde le style global
      }}
    />
  );
}
