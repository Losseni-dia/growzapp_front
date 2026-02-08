import type { Meta, StoryObj } from '@storybook/react';
import ProjetDetailsPage from './ProjetDetailsPage';
import { AuthProvider } from '../../components/Context/AuthContext';
import { CurrencyProvider } from '../../components/Context/CurrencyContext';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const meta: Meta<typeof ProjetDetailsPage> = {
  title: 'Growzapp/Projet/ProjetDetails',
  component: ProjetDetailsPage,
  decorators: [
    (Story) => {
      // FIX : On remplit TOUS les tokens possibles pour api.ts
      const fakeUser = { token: "fake-jwt", user: { id: 1, kycStatus: "VALIDE" } };
      localStorage.setItem("user", JSON.stringify(fakeUser));
      localStorage.setItem("token", "fake-jwt");
      localStorage.setItem("access_token", "fake-jwt");

      window.fetch = (url: any) => {
        const urlStr = url.toString();
        
        // MOCK DU PROJET : On s'assure que tout est "Number"
        if (urlStr.includes('/api/projets/1')) {
          return Promise.resolve(new Response(JSON.stringify({
            data: {
              id: 1,
              libelle: "Ferme Solaire Korhogo",
              description: "Installation de panneaux solaires photovoltaïques.",
              secteurNom: "ENERGIE",
              localiteNom: "KORHOGO",
              roiProjete: 12.5,
              prixUnePart: 50000, 
              objectifFinancement: 10000000,
              montantCollecte: 4500000,
              currencyCode: "XOF",
              partsDisponible: 1000,
              valuation: 50000000,
              statutProjet: "VALIDE",
              poster: "https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?w=800"
            }
          }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }

        // MOCK DU SOLDE 
        if (urlStr.includes('/api/wallets/solde')) {
          return Promise.resolve(new Response(JSON.stringify({
            soldeDisponible: 1500000
          }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }

        // AUTRES MOCKS
        if (urlStr.includes('/api/currencies/rates')) {
          return Promise.resolve(new Response(JSON.stringify({ XOF: 1, EUR: 0.0015 }), { status: 200 }));
        }
        
        return Promise.resolve(new Response(JSON.stringify({ data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      };

      return (
        <AuthProvider>
          <CurrencyProvider>
            <Story />
          </CurrencyProvider>
        </AuthProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof ProjetDetailsPage>;

export const VueStandard: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/projet/1']}>
        <Routes><Route path="/projet/:id" element={<Story />} /></Routes>
      </MemoryRouter>
    ),
  ],
};

export const VueInvestissement: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/projet/1?action=invest']}>
        <Routes><Route path="/projet/:id" element={<Story />} /></Routes>
      </MemoryRouter>
    ),
  ],
};