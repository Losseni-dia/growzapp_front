// src/pages/Admin/Investissements/InvestissementsAdminPage.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import InvestissementsAdminPage from "./InvestissementsAdminPage";
import { AuthProvider } from "../../../components/Context/AuthContext";
import { CurrencyProvider } from "../../../components/Context/CurrencyContext";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const meta: Meta<typeof InvestissementsAdminPage> = {
  title: "Growzapp/Admin/Investissements",
  component: InvestissementsAdminPage,
  decorators: [
    (Story) => {
      // Mock de l'API d'investissements
      window.fetch = (url: any) => {
        const path = url.toString();

        if (path.includes("/api/admin/investissements")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                data: [
                  {
                    id: 1,
                    date: "2025-02-01T10:00:00Z",
                    investisseurNom: "Sarr",
                    investisseurPrenom: "Mamadou",
                    investisseurEmail: "m.sarr@email.com",
                    investisseurTelephone: "+221 77 123 45 67",
                    projetLibelle: "Ferme Solaire Touba",
                    nombrePartsPris: 10,
                    prixUnePart: 5000,
                    statutPartInvestissement: "EN_ATTENTE",
                    pourcentage: 2.5,
                  },
                  {
                    id: 2,
                    date: "2025-01-20T14:30:00Z",
                    investisseurNom: "Diop",
                    investisseurPrenom: "Awa",
                    investisseurEmail: "awa.diop@email.com",
                    projetLibelle: "Boulangerie Moderne",
                    nombrePartsPris: 5,
                    prixUnePart: 10000,
                    statutPartInvestissement: "VALIDE",
                    numeroContrat: "GZ-2025-001",
                    pourcentage: 1.2,
                  },
                ],
              }),
              { status: 200 },
            ),
          );
        }
        return Promise.resolve(
          new Response(JSON.stringify({ XOF: 1 }), { status: 200 }),
        );
      };

      return (
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <CurrencyProvider>
                <div style={{ padding: "20px", background: "#f4f7f6" }}>
                  <Story />
                </div>
              </CurrencyProvider>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      );
    },
  ],
};

export default meta;
export const ListeInvestissements: StoryObj<typeof InvestissementsAdminPage> =
  {};
