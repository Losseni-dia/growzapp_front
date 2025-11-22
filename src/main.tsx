// src/main.tsx → LA VERSION QUE TU MÉRITES (19 novembre 2025)
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./components/context/AuthContext";
import GrowzToaster from "./components/ui/Toaster";
import "./index.css";

// IMPORT DU QUERYCLIENT CRÉÉ CI-DESSUS
import { queryClient } from "./lib/QueryClient";
import { QueryClientProvider } from "@tanstack/react-query";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* 1. React Query – gère le cache + le 401 proprement */}
    <QueryClientProvider client={queryClient}>
      {/* 2. Routing */}
      <BrowserRouter>
        {/* 3. Authentification */}
        <AuthProvider>
          <App />
          <GrowzToaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
