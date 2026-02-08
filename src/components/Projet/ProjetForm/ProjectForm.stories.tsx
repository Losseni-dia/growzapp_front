import type { Meta, StoryObj } from '@storybook/react';
import ProjectForm from './ProjetForm';
import { AuthProvider } from '../../Context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

const meta: Meta<typeof ProjectForm> = {
  title: 'Growzapp/Components/ProjectForm',
  component: ProjectForm,
  decorators: [
    (Story) => {
      // Simulation utilisateur entrepreneur
      localStorage.setItem("user", JSON.stringify({ 
        token: "fake-jwt", 
        user: { id: 2, nom: "Diop", prenom: "Awa", role: "ENTREPRENEUR" } 
      }));

      // Mock des références (Secteurs et Localités)
      window.fetch = (url: any) => {
        const urlStr = url.toString();
        
        if (urlStr.includes('/api/secteurs')) {
          return Promise.resolve(new Response(JSON.stringify({
            data: [{ id: 1, nom: "AGRICOLE" }, { id: 2, nom: "ENERGIE" }, { id: 3, nom: "TECH" }]
          }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }

        if (urlStr.includes('/api/localites')) {
          return Promise.resolve(new Response(JSON.stringify({
            data: [{ id: 1, nom: "ABIDJAN" }, { id: 2, nom: "BOUAKÉ" }, { id: 3, nom: "SAN-PEDRO" }]
          }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }

        return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
      };

      return (
        <BrowserRouter>
          <AuthProvider>
            <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '40px' }}>
              <Story />
            </div>
          </AuthProvider>
        </BrowserRouter>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof ProjectForm>;

export const NouveauProjet: Story = {};