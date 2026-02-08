import type { Meta, StoryObj } from '@storybook/react';
import ProjetsPage from './ProjetsPage';
import { AuthProvider } from '../../components/Context/AuthContext';
import { CurrencyProvider } from '../../components/Context/CurrencyContext';
import { BrowserRouter } from 'react-router-dom';

const meta: Meta<typeof ProjetsPage> = {
  title: 'Growzapp/Pages/CatalogueProjets',
  component: ProjetsPage,
  decorators: [
    (Story) => {
      // Mock de l'API pour le catalogue
      window.fetch = (url: any) => {
        const urlStr = url.toString();
        
        if (urlStr.includes('/api/projets')) {
          return Promise.resolve(new Response(JSON.stringify({
            success: true,
            data: [
              { id: 1, libelle: "Ferme Solaire", secteurNom: "ENERGIE", prixUnePart: 50000, objectifFinancement: 10000000, montantCollecte: 4500000, localiteNom: "KORHOGO", poster: "https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?w=400", createdAt: new Date().toISOString() },
              { id: 2, libelle: "Riziculture Bio", secteurNom: "AGRICOLE", prixUnePart: 25000, objectifFinancement: 5000000, montantCollecte: 5000000, localiteNom: "BOUAKÉ", poster: "https://images.unsplash.com/photo-1622383521027-a04653449148?w=400", createdAt: new Date().toISOString() },
              { id: 3, libelle: "Tech Hub Abidjan", secteurNom: "TECH", prixUnePart: 100000, objectifFinancement: 20000000, montantCollecte: 2000000, localiteNom: "ABIDJAN", poster: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400", createdAt: new Date().toISOString() },
              { id: 4, libelle: "Élevage Volaille", secteurNom: "AGRICOLE", prixUnePart: 15000, objectifFinancement: 3000000, montantCollecte: 1000000, localiteNom: "YAMOUSSOUKRO", poster: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400", createdAt: new Date().toISOString() }
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
export const VueCatalogue: StoryObj<typeof ProjetsPage> = {};