// src/pages/Contrat/ContratView/ContratView.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import ContratViewer from "./ContratView";
import { CurrencyProvider } from "../../../components/Context/CurrencyContext";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const meta: Meta<typeof ContratViewer> = {
  title: "Growzapp/Invest/ContratCertifie",
  component: ContratViewer,
  decorators: [
    (Story) => {
      window.fetch = (url: any) => {
        if (url.toString().includes("/api/contrats/data/")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                numeroContrat: "GZ-2025-X89",
                dateGeneration: new Date().toISOString(),
                projet: "Ferme Avicole Korhogo",
                investisseur: "Mamadou Sarr",
                emailInvestisseur: "m.sarr@email.com",
                telephone: "+221 77 000 00 00",
                montantInvesti: 500000,
                nombreParts: 10,
                prixUnitaire: 50000,
                pourcentage: 2.5,
                statutInvestissement: "VALIDE",
                lienVerification: "https://verify.growzapp.com/GZ-2025-X89",
                lienPdf: "#",
                currencyCode: "XOF",
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
        <MemoryRouter initialEntries={["/contrat/GZ-2025-X89"]}>
          <CurrencyProvider>
            <Routes>
              <Route path="/contrat/:numero" element={<Story />} />
            </Routes>
          </CurrencyProvider>
        </MemoryRouter>
      );
    },
  ],
};

export default meta;
export const VueContratDetaillee: StoryObj<typeof ContratViewer> = {};
