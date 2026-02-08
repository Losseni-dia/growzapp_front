import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProjetDetailsPage from '../../../pages/projetDetails/ProjetDetailsPage';
import { AuthProvider } from '../../Context/AuthContext';
import { CurrencyProvider } from '../../Context/CurrencyContext';

const meta: Meta<typeof ProjetDetailsPage> = {
  title: 'Growzapp/Invest/InvestClick',
  component: ProjetDetailsPage,
  decorators: [
    (Story) => {
      // Mock complet du projet (obligatoire pour InvestForm)
      window.fetch = (url: any) => {
        return Promise.resolve(new Response(JSON.stringify({
          data: { 
            id: 1, 
            libelle: "Ferme Solaire", 
            prixUnePart: 50000, 
            currencyCode: "XOF",
            objectifFinancement: 10000000,
            montantCollecte: 2000000 
          }
        }), { status: 200 }));
      };

      return (
        /* On simule l'arrivée sur la page AVEC le paramètre action=invest */
        <MemoryRouter initialEntries={['/projet/1?action=invest']}>
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
export const FormulaireOuvert: StoryObj<typeof ProjetDetailsPage> = {};