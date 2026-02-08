import type { Meta, StoryObj } from "@storybook/react";
import WalletsProjetsAdminPage from "./WalletsProjetsAdminPage";
import { AuthProvider } from "../../../components/Context/AuthContext";
import { CurrencyProvider } from "../../../components/Context/CurrencyContext";
import { BrowserRouter } from "react-router-dom";

const meta: Meta<typeof WalletsProjetsAdminPage> = {
  title: "Growzapp/Admin/WalletsProjetsAdminPage",
  component: WalletsProjetsAdminPage,
  decorators: [
    (Story) => {
      // 1. Simulation d'un admin connecté
      localStorage.setItem(
        "user",
        JSON.stringify({ id: 99, roles: ["ADMIN"] }),
      );

      // 2. Mock des appels API
      window.fetch = (url: any) => {
        const path = url.toString();

        // Mock de la liste des portefeuilles projets
        if (path.includes("/api/admin/projet-wallet/list")) {
          return Promise.resolve(
            new Response(
              JSON.stringify([
                {
                  id: 1,
                  projetId: 101,
                  soldeDisponible: 5000000,
                  soldeBloque: 500000,
                  soldeRetirable: 0,
                  walletType: "PROJET",
                },
                {
                  id: 2,
                  projetId: 102,
                  soldeDisponible: 12500000,
                  soldeBloque: 0,
                  soldeRetirable: 0,
                  walletType: "PROJET",
                },
              ]),
              { status: 200 },
            ),
          );
        }

        // Mock de la liste des projets pour enrichir les données
        if (path.includes("/api/projets")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                data: [
                  {
                    id: 101,
                    libelle: "Ferme Avicole Moderne",
                    statutProjet: "EN_COURS",
                    porteurNom: "Mamadou Sarr",
                  },
                  {
                    id: 102,
                    libelle: "Installation Solaire Touba",
                    statutProjet: "TERMINE",
                    porteurNom: "Awa Diop",
                  },
                ],
              }),
              { status: 200 },
            ),
          );
        }

        // Fallback pour les taux de change
        return Promise.resolve(
          new Response(JSON.stringify({ XOF: 1, EUR: 0.0015 }), {
            status: 200,
          }),
        );
      };

      return (
        <BrowserRouter>
          <AuthProvider>
            <CurrencyProvider>
              <div style={{ padding: "20px", backgroundColor: "#f9f9f9" }}>
                <Story />
              </div>
            </CurrencyProvider>
          </AuthProvider>
        </BrowserRouter>
      );
    },
  ],
};

// C'est cet export qui manquait ou qui était mal placé
export default meta;

type Story = StoryObj<typeof WalletsProjetsAdminPage>;

export const ListePortefeuilles: Story = {};
