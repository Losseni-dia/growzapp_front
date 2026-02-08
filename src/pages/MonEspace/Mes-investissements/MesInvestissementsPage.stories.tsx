import type { Meta, StoryObj } from "@storybook/react";
import MesInvestissementsPage from "./MesInvestissementsPage";
import { AuthProvider } from "../../../components/Context/AuthContext";
import { CurrencyProvider } from "../../../components/Context/CurrencyContext";
import { MemoryRouter } from "react-router-dom"; // Utilise MemoryRouter pour Storybook

const meta: Meta<typeof MesInvestissementsPage> = {
  title: "Growzapp/Me/MesInvestissementsPage",
  component: MesInvestissementsPage,
  decorators: [
    (Story) => {
      // Mock par défaut (Liste remplie)
      window.fetch = (url: any) => {
        const urlStr = url.toString();
        if (urlStr.includes("/api/investissements/mes-investissements")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                data: [
                  {
                    id: 1,
                    projetId: 101,
                    projetLibelle: "Ferme Solaire Korhogo",
                    projetPoster:
                      "https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?w=400",
                    montantInvesti: 500000,
                    nombrePartsPris: 10,
                    date: "2024-02-10T10:00:00Z",
                    statutPartInvestissement: "VALIDE",
                    numeroContrat: "CTR-2024-001",
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
        <MemoryRouter>
          {" "}
          {/* UN SEUL ROUTER ICI */}
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

export const ListeInvestissements: StoryObj<typeof MesInvestissementsPage> = {};

export const AucunInvestissement: StoryObj<typeof MesInvestissementsPage> = {
  decorators: [
    (Story) => {
      // On écrase seulement le fetch, PAS le Router
      window.fetch = () =>
        Promise.resolve(
          new Response(JSON.stringify({ data: [] }), { status: 200 }),
        );
      return <Story />; // On retourne juste la Story, elle sera entourée par les décorateurs du "meta"
    },
  ],
};
