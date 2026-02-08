import type { Meta, StoryObj } from '@storybook/react';
import MesProjetsPage from './MesProjetsPage';
import { AuthProvider } from '../../../components/Context/AuthContext';
import { CurrencyProvider } from '../../../components/Context/CurrencyContext';
import { BrowserRouter } from 'react-router-dom';

const meta: Meta<typeof MesProjetsPage> = {
  title: 'Growzapp/Me/MesProjetsPage',
  component: MesProjetsPage,
  decorators: [
    (Story) => {
      // Mock de l'API pour les projets du porteur
      window.fetch = (url: any) => {
        const urlStr = url.toString();
        
        if (urlStr.includes('/api/projets/mes-projets')) {
          return Promise.resolve(new Response(JSON.stringify({
            data: [
              {
                id: 1,
                libelle: "Extension Ferme Solaire",
                statutProjet: "VALIDE",
                objectifFinancement: 15000000,
                montantCollecte: 12000000,
                createdAt: "2024-01-01T10:00:00Z",
                investissements: new Array(24), // Simule 24 investisseurs
                poster: "https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?w=400"
              },
              {
                id: 2,
                libelle: "Unité de Transformation Riz",
                statutProjet: "SOUMIS",
                objectifFinancement: 8000000,
                montantCollecte: 0,
                createdAt: "2024-03-10T14:30:00Z",
                investissements: [],
                poster: "https://images.unsplash.com/photo-1622383521027-a04653449148?w=400"
              },
              {
                id: 3,
                libelle: "Culture Maraîchère Bio",
                statutProjet: "TERMINE",
                objectifFinancement: 5000000,
                montantCollecte: 5000000,
                createdAt: "2023-11-15T09:00:00Z",
                investissements: new Array(12),
                poster: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400"
              }
            ]
          }), { status: 200 }));
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
export const VueEntrepreneur: StoryObj<typeof MesProjetsPage> = {};