// src/components/Projet/ProjetCard/ProjectCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import ProjectCard from '../components/Projet/ProjetCard/ProjetCard'; // Vérifie que le chemin est relatif au fichier stories
import { AuthProvider } from '../components/Context/AuthContext';
import { CurrencyProvider } from '../components/Context/CurrencyContext';
import { BrowserRouter } from 'react-router-dom';

const meta: Meta<typeof ProjectCard> = {
  title: 'Growzapp/Components/ProjectCard', 
  component: ProjectCard,
  decorators: [
    (Story) => {
      // Simulation du localStorage pour AuthContext et api.ts
      localStorage.setItem("user", JSON.stringify({ 
        token: "fake-jwt-token", 
        user: { id: 1, nom: "Losseni", prenom: "Koné", kycStatus: "VALIDE" } 
      }));

      // Mock du fetch pour éviter les erreurs 404 dans CurrencyContext
      window.fetch = (url: any) => {
        const urlStr = url.toString();
        if (urlStr.includes('/api/currencies/rates')) {
          return Promise.resolve(new Response(JSON.stringify({ 
            XOF: 1, EUR: 0.0015, USD: 0.0016 
          }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }
        return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
      };

      return (
        <BrowserRouter>
          <AuthProvider>
            <CurrencyProvider>
              <div style={{ padding: '20px', maxWidth: '400px', backgroundColor: '#f8fafc' }}>
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
type Story = StoryObj<typeof ProjectCard>;

export const EnCours: Story = {
  args: {
    projet: {
      id: 1,
      libelle: "Ferme Solaire Korhogo",
      description: "Extension de la capacité de production d'énergie renouvelable.",
      secteurNom: "ENERGIE",
      localiteNom: "KORHOGO",
      paysNom: "CÔTE D'IVOIRE",
      roiProjete: 12.5,
      valeurTotalePartsEnPourcent: 15,
      prixUnePart: 50000,
      objectifFinancement: 10000000,
      montantCollecte: 4500000,
      currencyCode: "XOF",
      statutProjet: "VALIDE",
      poster: "https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?w=500",
      createdAt: new Date().toISOString()
    } as any,
  },
};

export const Termine: Story = {
  args: {
    projet: {
      ...EnCours.args?.projet,
      libelle: "Projet Terminé",
      montantCollecte: 10000000,
      statutProjet: "TERMINE"
    } as any,
  },
};