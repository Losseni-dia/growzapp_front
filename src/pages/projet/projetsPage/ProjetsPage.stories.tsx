import type { Meta, StoryObj } from '@storybook/react';
import ProjetsPage from './ProjetsPage';
import { AuthProvider } from '../../../components/Context/AuthContext';
import { CurrencyProvider } from '../../../components/Context/CurrencyContext';
import { BrowserRouter } from 'react-router-dom';

const meta: Meta<typeof ProjetsPage> = {
  title: 'Growzapp/Projet/CatalogueProjets',
  component: ProjetsPage,
  decorators: [
    (Story) => {
      // Mock de l'API avec des objets PROPRES et COMPLETS
      window.fetch = (url: any) => {
        const urlStr = url.toString();
        
        if (urlStr.includes('/api/projets')) {
          return Promise.resolve(new Response(JSON.stringify({
            success: true,
            data: [
              { 
                id: 1, 
                libelle: "Ferme Solaire", 
                secteurNom: "ENERGIE", 
                statutProjet: "VALIDE", // Indispensable pour .replace()
                prixUnePart: 50000, 
                objectifFinancement: 10000000, 
                montantCollecte: 4500000, 
                localiteNom: "KORHOGO", 
                poster: "https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?w=400", 
                createdAt: new Date().toISOString(),
                partsDisponible: 1000 // Sécurité pour InvestForm
              },
              { 
                id: 2, 
                libelle: "Riziculture Bio", 
                secteurNom: "AGRICOLE", 
                statutProjet: "TERMINE", 
                prixUnePart: 25000, 
                objectifFinancement: 5000000, 
                montantCollecte: 5000000, 
                localiteNom: "BOUAKÉ", 
                poster: "https://images.unsplash.com/photo-1622383521027-a04653449148?w=400", 
                createdAt: new Date().toISOString(),
                partsDisponible: 0
              }
            ]
          }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }
        // Mock des devises pour éviter le 404
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
export const VueCatalogue: StoryObj<typeof ProjetsPage> = {};