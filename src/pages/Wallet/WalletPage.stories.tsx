import type { Meta, StoryObj } from '@storybook/react';
import WalletPage from '../../pages/Wallet/WalletPage';
import { AuthProvider } from '../../components/Context/AuthContext';
import { CurrencyProvider } from '../../components/Context/CurrencyContext';
import { BrowserRouter } from 'react-router-dom';

const meta: Meta<typeof WalletPage> = {
  title: 'Growzapp/Pages/WalletPage',
  component: WalletPage,
  decorators: [
    (Story) => {
      // 1. Simulation de l'utilisateur pour api.ts
      localStorage.setItem("user", JSON.stringify({ token: "ey-fake-token", login: "losseni" }));

      // 2. Mock du fetch pour alimenter les BalanceCards et les TransactionRows
      window.fetch = (url: any) => {
        const urlStr = url.toString();
        
        // Mock du solde
        if (urlStr.includes('/api/wallets/solde')) {
          return Promise.resolve(new Response(JSON.stringify({
            soldeDisponible: 750000,
            soldeBloque: 200000,
            soldeRetirable: 50000
          }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }

        // Mock des transactions (Affiche ton nouveau composant TransactionRow)
        if (urlStr.includes('/api/transactions/mes-transactions')) {
          return Promise.resolve(new Response(JSON.stringify([
            { id: 1, type: 'DEPOT', montant: 500000, statut: 'SUCCESS', createdAt: '2025-11-20T10:00:00Z' },
            { id: 2, type: 'INVESTISSEMENT', montant: 150000, statut: 'SUCCESS', createdAt: '2025-11-21T14:30:00Z' },
            { id: 3, type: 'TRANSFERT_OUT', montant: 25000, statut: 'SUCCESS', createdAt: '2025-11-22T09:15:00Z' },
            { id: 4, type: 'DIVIDENDE', montant: 12500, statut: 'SUCCESS', createdAt: '2025-11-23T18:00:00Z' },
            { id: 5, type: 'RETRAIT', montant: 10000, statut: 'PENDING', createdAt: '2025-11-24T11:45:00Z' }
          ]), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }

        // Mock des taux de change
        if (urlStr.includes('/api/currencies/rates')) {
          return Promise.resolve(new Response(JSON.stringify({ XOF: 1, EUR: 655.95 }), { status: 200 }));
        }

        return Promise.reject(new Error("URL non mockée : " + urlStr));
      };

      return (
        <BrowserRouter>
          <AuthProvider>
            <CurrencyProvider>
              <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '20px' }}>
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

export const VueComplete: Story = {};