import type { Meta, StoryObj } from '@storybook/react';
import ProjetDetailsPage from '../pages/ProjetDetails/ProjetDetailsPage';
import { AuthProvider } from '../components/Context/AuthContext';
import { CurrencyProvider } from '../components/Context/CurrencyContext';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const meta: Meta<typeof ProjetDetailsPage> = {
  title: 'Growzapp/Pages/ProjetDetails',
  component: ProjetDetailsPage,
  decorators: [
    (Story) => {
      // 1. Simulation de la session pour AuthContext
      localStorage.setItem("user", JSON.stringify({ 
        token: "fake-jwt", 
        user: { id: 1, nom: "Koné", prenom: "Losseni", kycStatus: "VALIDE" } 
      }));

      // 2. Interception Fetch (Mocks complets)
      window.fetch = (url: any) => {
        const urlStr = url.toString();
        
        // Mock du projet avec TOUTES les propriétés numériques pour éviter les NaN
        if (urlStr.includes('/api/projets/')) {
          return Promise.resolve(new Response(JSON.stringify({
            data: {
              id: 1,
              libelle: "Ferme Solaire Korhogo",
              description: "Installation de panneaux solaires photovoltaïques pour l'électrification rurale. Un projet à fort impact social et écologique.",
              secteurNom: "ENERGIE",
              localiteNom: "KORHOGO",
              siteNom: "Site Nord-Alpha",
              roiProjete: 12.5,
              valuation: 50000000,
              partsDisponible: 1000,
              partsPrises: 150,
              prixUnePart: 50000, // Important pour InvestForm
              objectifFinancement: 10000000,
              montantCollecte: 4500000,
              currencyCode: "XOF",
              valeurTotalePartsEnPourcent: 20,
              poster: "https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?w=800",
              statutProjet: "VALIDE",
              createdAt: new Date().toISOString()
            }
          }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }

        // Mock du portefeuille (Wallet) - Requis par InvestForm
        if (urlStr.includes('/api/wallets/solde')) {
          return Promise.resolve(new Response(JSON.stringify({
            soldeDisponible: 1500000,
            soldeBloque: 500000,
            soldeRetirable: 1000000
          }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }

        // Mock des documents
        if (urlStr.includes('/api/documents/projet/')) {
          return Promise.resolve(new Response(JSON.stringify({
            data: [{ id: 101, nom: "Fiche_Technique.pdf", uploadedAt: new Date().toISOString() }]
          }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }

        // Mock des devises
        if (urlStr.includes('/api/currencies/rates')) {
          return Promise.resolve(new Response(JSON.stringify({ XOF: 1, EUR: 0.0015 }), { status: 200 }));
        }

        return Promise.resolve(new Response(JSON.stringify({ data: [] }), { status: 200 }));
      };

      return (
        <MemoryRouter initialEntries={['/projet/1']}>
          <AuthProvider>
            <CurrencyProvider>
              <Routes>
                <Route path="/projet/:id" element={<Story />} />
              </Routes>
            </CurrencyProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof ProjetDetailsPage>;

export const VueComplete: Story = {};