// src/lib/queryClient.ts → VERSION FINALE INDESTRUCTIBLE (19 novembre 2025)
import { QueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

// On crée un QueryClient normal
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 min
      gcTime: 10 * 60 * 1000, // 10 min (ex-cacheTime)
    },
    mutations: {
      // ON GÈRE LE 401 ICI, MAIS SANS APPELER useAuth (impossible hors contexte)
      onError: (error: any) => {
        if (
          error?.message === "Unauthorized" ||
          error?.message?.includes("401")
        ) {
          toast.error("Session expirée – redirection vers la connexion...");

          // On vide proprement le storage
          localStorage.removeItem("user");
          localStorage.removeItem("access_token");
          localStorage.removeItem("token");

          // Redirection douce (pas de rechargement brutal)
          window.location.href = "/login";
        }
      },
    },
  },
});
