// src/components/Admin/Roles/RoleManagerModal.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import RolesManagerModal from "./RoleManagerModal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const meta: Meta<typeof RolesManagerModal> = {
  title: "Growzapp/Admin/Users/RolesManagerModal",
  component: RolesManagerModal,
  decorators: [
    (Story) => {
      window.fetch = (url: any) => {
        if (url.toString().includes("/api/admin/users/roles")) {
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
          <div
            style={{
              width: "400px",
              padding: "20px",
              background: "white",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <Story />
          </div>
        </QueryClientProvider>
      );
    },
  ],
};

export default meta;

export const GestionDesRoles: StoryObj<typeof RolesManagerModal> = {
  args: {
    userId: 1,
    currentRoles: ["USER", "INVESTISSEUR"],
    onClose: () => alert("Modale fermée"),
  },
};
