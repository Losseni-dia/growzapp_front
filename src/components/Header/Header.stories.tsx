import type { Meta, StoryObj } from "@storybook/react";
import Header from "./Header";
import { AuthProvider } from "../Context/AuthContext";
import { CurrencyProvider } from "../Context/CurrencyContext";
import { BrowserRouter } from "react-router-dom";

const meta: Meta<typeof Header> = {
  title: "Growzapp/Components/Header",
  component: Header,
  decorators: [
    (Story) => (
      <BrowserRouter>
        <AuthProvider>
          <CurrencyProvider>
            <div style={{ minHeight: "150px", backgroundColor: "#f8fafc" }}>
              <Story />
            </div>
          </CurrencyProvider>
        </AuthProvider>
      </BrowserRouter>
    ),
  ],
};

export default meta;

// 1. Vue Visiteur (Déconnecté)
export const Visiteur: StoryObj<typeof Header> = {
  decorators: [
    (Story) => {
      // On vide tout pour être sûr
      localStorage.clear();
      // On peut même forcer un rechargement si nécessaire, 
      // mais normalement vider le storage suffit au prochain montage
      return <Story />;
    }
  ],
  // On ajoute un paramètre pour forcer le re-rendu
  parameters: {
    docs: { disable: true }, 
  }
};

// 2. Vue Investisseur Connecté
export const MembreConnecte: StoryObj<typeof Header> = {
  decorators: [
    (Story) => {
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: 1,
          prenom: "Jean",
          roles: ["INVESTISSEUR"],
          image: null,
        }),
      );
      return <Story />;
    },
  ],
};

// 3. Vue Administrateur
export const Administrateur: StoryObj<typeof Header> = {
  decorators: [
    (Story) => {
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: 1,
          prenom: "Admin",
          roles: ["ADMIN"],
          image: null,
        }),
      );
      return <Story />;
    },
  ],
};
