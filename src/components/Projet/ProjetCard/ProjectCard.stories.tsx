import type { Meta, StoryObj } from '@storybook/react';
import ProjectCard from './ProjetCard';
import { AuthProvider } from '../../Context/AuthContext';
import { CurrencyProvider } from '../../Context/CurrencyContext';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ProjetDTO } from '../../../types';
import { useEffect } from 'react';

// Petit utilitaire pour prouver que le bouton "Investir" fonctionne
const URLWatcher = () => {
  const location = useLocation();
  useEffect(() => {
    if (location.search.includes('action=invest')) {
      console.log("SUCCÈS : Redirection vers le formulaire d'investissement détectée !");
    }
  }, [location]);

  return (
    <div style={{ marginTop: '15px', padding: '10px', background: '#e3f2fd', borderRadius: '4px', fontSize: '12px' }}>
      <strong>URL Simulée :</strong> {location.pathname}{location.search || '(aucune action)'}
    </div>
  );
};

const meta: Meta<typeof ProjectCard> = {
  title: 'Growzapp/Components/ProjectCard',
  component: ProjectCard,
  decorators: [
    (Story) => {
      // On prépare le stockage pour éviter les erreurs de token dans la console
      localStorage.setItem("token", "fake-jwt");
      
      return (
        <MemoryRouter initialEntries={['/']}>
          <AuthProvider>
            <CurrencyProvider>
              <div style={{ padding: '40px', maxWidth: '400px', backgroundColor: '#f1f5f9' }}>
                <Routes>
                  <Route path="*" element={
                    <>
                      <Story />
                      <URLWatcher />
                    </>
                  } />
                </Routes>
              </div>
            </CurrencyProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    },
  ],
};

export default meta;

export const ProjetComplet: StoryObj<typeof ProjectCard> = {
  args: {
    projet: {
      id: 1,
      libelle: "Ferme Solaire Korhogo",
      description: "Installation de panneaux photovoltaïques.",
      secteurNom: "ÉNERGIE",
      localiteNom: "KORHOGO",
      paysNom: "Côte d'Ivoire",
      roiProjete: 12.5,
      valuation: 50000000,
      objectifFinancement: 10000000,
      montantCollecte: 4500000,
      prixUnePart: 50000,
      partsDisponible: 1000,
      partsPrises: 90,
      currencyCode: "XOF",
      statutProjet: "VALIDE",
      poster: "https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?w=500",
      createdAt: new Date().toISOString(),
    } as ProjetDTO 
  }
};