import type { Meta, StoryObj } from '@storybook/react';
import MesDividendesPage from './MesDividendes';
import { AuthProvider } from '../../../components/Context/AuthContext';
import { CurrencyProvider } from '../../../components/Context/CurrencyContext';
import { BrowserRouter } from 'react-router-dom';

const meta: Meta<typeof MesDividendesPage> = {
  title: 'Growzapp/Investor/MesDividendesPage',
  component: MesDividendesPage,
  decorators: [
    (Story) => {
      // Mock des dividendes : Un payé, un planifié
      window.fetch = (url: any) => {
        const urlStr = url.toString();
        
        if (urlStr.includes('/api/dividendes/mes-dividendes')) {
          return Promise.resolve(new Response(JSON.stringify({
            success: true,
            data: [
              {
                id: 1,
                projetLibelle: "Ferme Solaire Korhogo",
                montantTotal: 125000,
                montantParPart: 12500,
                datePaiement: "2024-01-20T10:00:00Z",
                statutDividende: "PAYE",
                facture: { id: 501, numeroFacture: "FAC-2024-001" }
              },
              {
                id: 2,
                projetLibelle: "Riziculture Bio",
                montantTotal: 45000,
                montantParPart: 7500,
                datePaiement: "2024-06-15T10:00:00Z",
                statutDividende: "PLANIFIE",
                facture: null
              }
            ]
          }), { status: 200 }));
        }
        // Mock par défaut pour les taux de devises
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
export const VueGains: StoryObj<typeof MesDividendesPage> = {};