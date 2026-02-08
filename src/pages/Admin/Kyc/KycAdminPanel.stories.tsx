// src/pages/Admin/KYC/KycAdminPanel.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { KycAdminPanel } from "./KycAdminPanel";
import { AuthProvider } from "../../../components/Context/AuthContext";
import { BrowserRouter } from "react-router-dom";

const meta: Meta<typeof KycAdminPanel> = {
  title: "Growzapp/Admin/KYCPanel",
  component: KycAdminPanel,
  decorators: [
    (Story) => {
      window.fetch = (url: any) => {
        const path = url.toString();

        // Mock de la liste des dossiers en attente
        if (path.includes("/api/kyc/admin/en-attente")) {
          return Promise.resolve(
            new Response(
              JSON.stringify([
                {
                  id: 10,
                  prenom: "Losseni",
                  nom: "Koné",
                  login: "losseni_dev",
                  kycNumeroPiece: "CI-00987762",
                  kycDateExpiration: "2027-12-31",
                  kycStatus: "EN_ATTENTE",
                },
                {
                  id: 11,
                  prenom: "Marie",
                  nom: "Dubois",
                  login: "m.dubois",
                  kycNumeroPiece: "FR-7762551",
                  kycDateExpiration: "2025-03-15", // Proche expiration
                  kycStatus: "EN_ATTENTE",
                },
              ]),
              { status: 200 },
            ),
          );
        }

        // Mock pour l'ouverture des documents (Simule un fichier image vide)
        if (path.includes("/api/kyc/admin/document/")) {
          return Promise.resolve(
            new Response(
              new Blob(["fake-image-content"], { type: "image/png" }),
              {
                status: 200,
                headers: { "Content-Type": "application/octet-stream" },
              },
            ),
          );
        }

        return Promise.resolve(
          new Response(JSON.stringify({}), { status: 200 }),
        );
      };

      return (
        <BrowserRouter>
          <AuthProvider>
            <div style={{ padding: "20px", background: "#f8fafc" }}>
              <Story />
            </div>
          </AuthProvider>
        </BrowserRouter>
      );
    },
  ],
};

export default meta;
export const DossiersEnAttente: StoryObj<typeof KycAdminPanel> = {};

export const AucunDossier: StoryObj<typeof KycAdminPanel> = {
  decorators: [
    (Story) => {
      window.fetch = () =>
        Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
      return <Story />;
    },
  ],
};
