import type { Meta, StoryObj } from "@storybook/react";
import DashboardAdmin from "./AdminDashboard";
import { AuthProvider } from "../../components/Context/AuthContext";
import { CurrencyProvider } from "../../components/Context/CurrencyContext";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const meta: Meta<typeof DashboardAdmin> = {
  title: "Growzapp/Admin/Dashboard",
  component: DashboardAdmin,
  decorators: [
    (Story) => {
      localStorage.setItem(
        "user",
        JSON.stringify({ id: 99, roles: ["ADMIN"] }),
      );

      // Mock des multiples endpoints de stats
      window.fetch = (url: any) => {
        const path = url.toString();
        let response = {};
        if (path.includes("/api/admin/projets"))
          response = { data: new Array(12).fill({}) };
        if (path.includes("/solde-total")) response = 45000000;
        if (path.includes("/montant-total-collecte")) response = 48000000;
        if (path.includes("/kyc/admin/en-attente"))
          response = new Array(5).fill({});
        if (path.includes("/retraits-en-attente"))
          response = new Array(3).fill({});

        return Promise.resolve(
          new Response(JSON.stringify(response), { status: 200 }),
        );
      };

      return (
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <CurrencyProvider>
                <Story />
              </CurrencyProvider>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      );
    },
  ],
};

export default meta;
export const VueAdminPrincipale: StoryObj<typeof DashboardAdmin> = {};
