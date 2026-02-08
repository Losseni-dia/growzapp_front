// src/pages/HomePage/HomePage.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import HomePage from "./HomePage";
import { AuthProvider } from "../../components/Context/AuthContext";
import { CurrencyProvider } from "../../components/Context/CurrencyContext";
import { MemoryRouter } from "react-router-dom";

const meta: Meta<typeof HomePage> = {
  title: "Growzapp/Starters/HomePage",
  component: HomePage,
  decorators: [
    (Story) => {
      // Mock de l'API des projets pour l'accueil
      window.fetch = (url: any) => {
        const urlStr = url.toString();

        if (urlStr.includes("/api/projets")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                data: [
                  {
                    id: 1,
                    libelle: "Ferme Avicole Moderne",
                    objectifFinancement: 5000000,
                    montantCollecte: 3500000,
                    statutProjet: "EN_COURS",
                    porteurNom: "Sarr",
                    poster:
                      "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=500",
                  },
                  {
                    id: 2,
                    libelle: "Centrale Solaire Villageoise",
                    objectifFinancement: 10000000,
                    montantCollecte: 8500000,
                    statutProjet: "VALIDE",
                    porteurNom: "Diop",
                    poster:
                      "https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?w=500",
                  },
                  {
                    id: 3,
                    libelle: "Boulangerie Artisanale",
                    objectifFinancement: 2000000,
                    montantCollecte: 2000000,
                    statutProjet: "TERMINE",
                    porteurNom: "Fall",
                    poster:
                      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500",
                  },
                ],
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            ),
          );
        }

        // Mock par défaut pour les devises
        return Promise.resolve(
          new Response(JSON.stringify({ XOF: 1, EUR: 0.0015 }), {
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

export const VueAccueil: StoryObj<typeof HomePage> = {};
