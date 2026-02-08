// src/pages/Admin/Users/UsersAdminPage.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import UsersAdminPage from "./AdminUsersPage";
import { AuthProvider } from "../../../components/Context/AuthContext";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const meta: Meta<typeof UsersAdminPage> = {
  title: "Growzapp/Admin/Users/UsersAdminPage",
  component: UsersAdminPage,
  decorators: [
    (Story) => {
      // Mock de l'API /admin/users
      window.fetch = (url: any) => {
        const path = url.toString();

        if (path.includes("/admin/users")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                success: true,
                data: [
                  {
                    id: 1,
                    prenom: "Losseni",
                    nom: "Koné",
                    email: "losseni@growzapp.com",
                    login: "losseni_admin",
                    roles: ["ADMIN", "USER"],
                    enabled: true,
                    kycStatus: "VALIDE",
                    kycDateExpiration: "2028-12-31",
                    kycNumeroPiece: "CI-12345678",
                  },
                  {
                    id: 2,
                    prenom: "Marie",
                    nom: "Dubois",
                    email: "m.dubois@email.com",
                    login: "marie_invest",
                    roles: ["USER"],
                    enabled: true,
                    kycStatus: "EN_ATTENTE",
                    kycDateExpiration: "2024-05-15", // Bientôt expiré
                  },
                  {
                    id: 3,
                    prenom: "Jean",
                    nom: "Dupont",
                    email: "jean.d@email.com",
                    login: "jeand",
                    roles: ["USER"],
                    enabled: false,
                    kycStatus: "REJETE",
                    kycCommentaireRejet: "Photo de la pièce illisible.",
                  },
                ],
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            ),
          );
        }

        // Mock pour RolesManagerModal (all-roles)
        if (path.includes("/api/admin/users/roles")) {
          return Promise.resolve(
            new Response(
              JSON.stringify([
                "USER",
                "ADMIN",
                "PORTEUR_PROJET",
                "INVESTISSEUR",
              ]),
              { status: 200 },
            ),
          );
        }

        return Promise.resolve(
          new Response(JSON.stringify({}), { status: 200 }),
        );
      };

      return (
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <div
                style={{
                  padding: "20px",
                  backgroundColor: "#f4f7f6",
                  minHeight: "100vh",
                }}
              >
                <Story />
              </div>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      );
    },
  ],
};

export default meta;
export const ListeUtilisateurs: StoryObj<typeof UsersAdminPage> = {};
