// src/main.tsx
import React, { Suspense } from "react"; // <--- 1. AJOUT DE SUSPENSE
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./components/context/AuthContext";
import GrowzToaster from "./components/ui/Toaster";
import "./index.css";

// <--- 2. AJOUT IMPÉRATIF DE L'IMPORT I18N
import "./i18n";
// Cela lance la détection de la langue au démarrage

import { queryClient } from "./lib/QueryClient";
import { QueryClientProvider } from "@tanstack/react-query";

// Petit composant de chargement le temps que la langue arrive
const Loading = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
    }}
  >
    Chargement de GrowzApp...
  </div>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* 3. ENVELOPPER L'APP AVEC SUSPENSE */}
    <Suspense fallback={<Loading />}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
            <GrowzToaster />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </Suspense>
  </React.StrictMode>
);
