import type { Meta, StoryObj } from "@storybook/react";
import AdminStatsPanel from "./GlobalStats";
import { AuthProvider } from "../../../components/Context/AuthContext";
import { CurrencyProvider } from "../../../components/Context/CurrencyContext";
import { BrowserRouter } from "react-router-dom";

const meta: Meta<typeof AdminStatsPanel> = {
  title: "Growzapp/Admin/Reports/Analytics",
  component: AdminStatsPanel,
  decorators: [
    (Story) => {
      // MOCK GLOBAL
      window.fetch = (url: any) => {
        const urlStr = url.toString();

        // 1. Mock des statistiques (Formaté pour .then(res => res.data))
        if (urlStr.includes("api/admin/dashboard-stats")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                data: {
                  totalCollecte: 125000000,
                  totalObjectif: 150000000,
                  countUsers: 1250,
                  secteurs: {
                    Agriculture: 45,
                    Solaire: 32,
                    Commerce: 18,
                    Tech: 10,
                  },
                  evolution: [
                    { date: "2024-01", montant: 10000000 },
                    { date: "2024-02", montant: 25000000 },
                    { date: "2024-03", montant: 45000000 },
                    { date: "2024-04", montant: 85000000 },
                    { date: "2024-05", montant: 125000000 },
                  ],
                },
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            ),
          );
        }

        // 2. Mock critique pour CurrencyProvider (Empêche le blocage du rendu)
        return Promise.resolve(
          new Response(JSON.stringify({ XOF: 1, EUR: 0.0015 }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      };

      return (
        <BrowserRouter>
          <AuthProvider>
            <CurrencyProvider>
              {/* Le minHeight est CRITIQUE ici pour que ResponsiveContainer de Recharts puisse calculer une taille */}
              <div
                style={{
                  padding: "20px",
                  background: "#f8fafc",
                  minHeight: "100vh",
                }}
              >
                <Story />
              </div>
            </CurrencyProvider>
          </AuthProvider>
        </BrowserRouter>
      );
    },
  ],
};

export default meta;
export const RapportComplet: StoryObj<typeof AdminStatsPanel> = {};
