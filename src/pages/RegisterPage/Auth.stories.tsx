// src/pages/Auth.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import LoginPage from "../../LoginPage/LoginPage";
import RegisterPage from "./RegisterPage";
import { AuthProvider } from "../../../components/Context/AuthContext";
import { MemoryRouter } from "react-router-dom";

const meta: Meta = {
  title: "Growzapp/Starters/Auth",
  decorators: [
    (Story) => (
      <MemoryRouter>
        <AuthProvider>
          <div style={{ background: "#f0f2f5", minHeight: "100vh" }}>
            <Story />
          </div>
        </AuthProvider>
      </MemoryRouter>
    ),
  ],
};

export default meta;

export const Inscription: StoryObj<typeof RegisterPage> = {
  render: () => <RegisterPage />,
};

export const Connexion: StoryObj<typeof LoginPage> = {
  render: () => <LoginPage />,
};



