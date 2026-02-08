import type { Meta, StoryObj } from '@storybook/react';
import MesInvestissementsPage from './MesInvestissementsPage';
import { AuthProvider } from '../../../components/Context/AuthContext';
import { CurrencyProvider } from '../../../components/Context/CurrencyContext';
import { BrowserRouter } from 'react-router-dom';

const meta: Meta<typeof MesInvestissementsPage> = {
  title: 'Growzapp/Investor/MesInvestissementsPage',
  component: MesInvestissementsPage,
  decorators: [
    (Story) => {
      // Mock de l'API pour les investissements
      window.fetch = (url: any) => {
        const urlStr = url.toString();
        
        if (urlStr.includes('/api/investissements/mes-investissements')) {
          return Promise.resolve(new Response(JSON.stringify({
            data: [
              {
                id: 1,
                projetId: 101,
                projetLibelle: "Ferme Solaire Korhogo",
                projetPoster: "https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?w=400",
                montantInvesti: 500000,
                nombrePartsPris: 10,
                date: "2024-02-10T10:00:00Z",
                statutPartInvestissement: "VALIDE",
                numeroContrat: "CTR-2024-001"
              },
              {
                id: 2,
                projetId: 102,
                projetLibelle: "Riziculture Bio",
                projetPoster: "https://images.unsplash.com/photo-1622383521027-a04653449148?w=400",
                montantInvesti: 150000,
                nombrePartsPris: 6,
                date: "2024-03-05T14:30:00Z",
                statutPartInvestissement: "EN_ATTENTE",
                numeroContrat: null
              },
              {
                id: 3,
                projetId: 103,
                projetLibelle: "Tech Hub Abidjan",
                projetPoster: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400",
                montantInvesti: 1000000,
                nombrePartsPris: 10,
                date: "2024-01-15T09:00:00Z",
                statutPartInvestissement: "REJETE",
                numeroContrat: null
              }
            ]
          }), { status: 200 }));
        }
        // Mock par défaut pour les devises
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
export const ListeInvestissements: StoryObj<typeof MesInvestissementsPage> = {};

export const AucunInvestissement: StoryObj<typeof MesInvestissementsPage> = {
  decorators: [
    (Story) => {
      window.fetch = () => Promise.resolve(new Response(JSON.stringify({ data: [] }), { status: 200 }));
      return <BrowserRouter><AuthProvider><CurrencyProvider><Story /></CurrencyProvider></AuthProvider></BrowserRouter>;
    }
  ]
};