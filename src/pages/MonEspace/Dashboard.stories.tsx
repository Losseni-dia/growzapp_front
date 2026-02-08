// src/pages/Dashboard/Dashboard.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import Dashboard from "./Dashboard";
import { AuthProvider } from "../../components/Context/AuthContext";
import { CurrencyProvider } from "../../components/Context/CurrencyContext";
import { MemoryRouter } from "react-router-dom";

const meta: Meta<typeof Dashboard> = {
  title: "Growzapp/Pages/Dashboard",
  component: Dashboard,
  decorators: [
    (Story) => {
      // 1. ON FORCE LES DONNÉES DANS LE STORAGE
      const fakeUser = {
        id: 1,
        prenom: "Losseni",
        nom: "Dia",
        email: "losseni@growzapp.com",
        kycStatus: "VALIDE", // Change en "REJETE" pour tester l'alerte
        roles: ["INVESTISSEUR", "PORTEUR_PROJET"],
        image: null,
        localite: { nom: "Abidjan", paysNom: "Côte d'Ivoire" },
      };

      localStorage.setItem("user", JSON.stringify(fakeUser));
      localStorage.setItem("access_token", "fake-token-123");

      // 2. MOCK FETCH POUR TOUTES LES ROUTES DU DASHBOARD
      window.fetch = (url: any) => {
        const path = url.toString();
        let data = {};

        if (path.includes("/wallets/solde"))
          data = { soldeDisponible: 1500000 };
        if (path.includes("/investissements")) data = { data: [{}, {}, {}] };
        if (path.includes("/projets"))
          data = { data: [{ montantCollecte: 2000000 }] };
        if (path.includes("/dividendes")) data = { data: [] };
        if (path.includes("/currencies")) data = { XOF: 1, EUR: 0.0015 };

        return Promise.resolve(
          new Response(JSON.stringify(data), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      };

      return (
        <MemoryRouter>
          <AuthProvider>
            <CurrencyProvider>
              <Story />
            </CurrencyProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    },
  ],
};

export default meta;
export const VueFonctionnelle: StoryObj<typeof Dashboard> = {};
