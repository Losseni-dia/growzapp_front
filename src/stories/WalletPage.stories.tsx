import type { Meta, StoryObj } from '@storybook/react';
import WalletPage from '../pages/Wallet/WalletPage';
import { AuthProvider } from '../components/Context/AuthContext';
import { CurrencyProvider } from '../components/Context/CurrencyContext';
import { BrowserRouter } from 'react-router-dom';

const meta: Meta<typeof WalletPage> = {
  title: 'Growzapp/Pages/WalletPage',
  component: WalletPage,
  decorators: [
    (Story) => {
      // --- INJECTION DU TOKEN POUR API.TS ---
      localStorage.setItem("user", JSON.stringify({ token: "ey-fake-token", login: "losseni" }));

      // --- MOCK DIRECT DU FETCH (COURT-CIRCUITE MSW) ---
      window.fetch = (url: any) => {
        const urlStr = url.toString();
        
        // Simulation réponse Solde
        if (urlStr.includes('/api/wallets/solde')) {
          return Promise.resolve(new Response(JSON.stringify({
            soldeDisponible: 750000,
            soldeBloque: 200000,
            soldeRetirable: 50000
          }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }

        // Simulation réponse Transactions
        if (urlStr.includes('/api/transactions/mes-transactions')) {
          return Promise.resolve(new Response(JSON.stringify([
            { id: 1, type: 'DEPOT', montant: 50000, statut: 'SUCCESS', createdAt: new Date().toISOString() },
            { id: 2, type: 'INVESTISSEMENT', montant: 100000, statut: 'SUCCESS', createdAt: new Date().toISOString() }
          ]), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }

        // Simulation réponse devises (pour éviter l'erreur dans CurrencyContext)
        if (urlStr.includes('/api/currencies/rates')) {
          return Promise.resolve(new Response(JSON.stringify({ XOF: 1, EUR: 655.95 }), { status: 200 }));
        }

        return Promise.reject(new Error("URL non mockée : " + urlStr));
      };

      return (
        <BrowserRouter>
          <AuthProvider>
            <CurrencyProvider>
              <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '20px' }}>
                <Story />
              </div>
            </CurrencyProvider>
          </AuthProvider>
        </BrowserRouter>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof WalletPage>;

export const CompteActif: Story = {};