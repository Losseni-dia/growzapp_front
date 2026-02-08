import type { Meta, StoryObj } from '@storybook/react';
import Dashboard from './Dashboard';
import { AuthProvider } from '../../components/Context/AuthContext';
import { CurrencyProvider } from '../../components/Context/CurrencyContext';
import { BrowserRouter } from 'react-router-dom';

const meta: Meta<typeof Dashboard> = {
  title: 'Growzapp/Pages/Dashboard',
  component: Dashboard,
  decorators: [
    (Story) => {
      // Simulation du localStorage pour AuthContext
      localStorage.setItem("user", JSON.stringify({ 
        id: 1, 
        nom: "Kouassi", 
        prenom: "Jean", 
        email: "jean.kouassi@email.com",
        kycStatus: "REJETE", // On simule un rejet pour voir la bannière d'alerte
        kycCommentaireRejet: "Photo de la pièce d'identité floue.",
        image: null,
        roles: ["INVESTISSEUR", "PORTEUR_PROJET"],
        localite: { nom: "Abidjan", paysNom: "Côte d'Ivoire" }
      }));

      // Mock de tous les appels API du Dashboard
      window.fetch = (url: any) => {
        const urlStr = url.toString();
        
        if (urlStr.includes('/api/wallets/solde')) {
          return Promise.resolve(new Response(JSON.stringify({ soldeDisponible: 750000 }), { status: 200 }));
        }
        if (urlStr.includes('/api/investissements/mes-investissements')) {
          return Promise.resolve(new Response(JSON.stringify({ data: new Array(5).fill({}) }), { status: 200 }));
        }
        if (urlStr.includes('/api/projets/mes-projets')) {
          return Promise.resolve(new Response(JSON.stringify({ data: new Array(2).fill({ montantCollecte: 12000000 }) }), { status: 200 }));
        }
        if (urlStr.includes('/api/dividendes/mes-dividendes')) {
          return Promise.resolve(new Response(JSON.stringify({ data: [{ statutDividende: "PAYE", montantTotal: 45000 }] }), { status: 200 }));
        }
        return Promise.resolve(new Response(JSON.stringify({ XOF: 1, EUR: 0.0015 }), { status: 200 }));
      };

      return (
        <BrowserRouter>
          <AuthProvider>
            <CurrencyProvider>
              <Story />
            </CurrencyProvider>
          </AuthProvider>
        </BrowserRouter>
      );
    },
  ],
};

export default meta;
export const VueComplete: StoryObj<typeof Dashboard> = {};