// src/types/projet.ts

import type { StatutProjet } from "./enum";
import type { DocumentDTO } from "./document";
import type { InvestissementDTO } from "./investissement";

export interface ProjetDTO {
  id: number;
  poster?: string;
  reference?: number;
  libelle: string;
  description: string;
  valuation: number;
  roiProjete: number;
  partsDisponible: number;
  partsPrises: number;
  prixUnePart: number;
  objectifFinancement: number;
  montantCollecte: number;

  // NOUVEAU CHAMP : Indispensable pour la conversion automatique
  currencyCode: string;

  dateDebut?: string;
  dateFin?: string;
  valeurTotalePartsEnPourcent: number;
  statutProjet: StatutProjet;
  createdAt: string;

  porteurId?: number;
  porteurNom?: string;

  siteId?: number;
  siteNom?: string;
  secteurId?: number;
  secteurNom?: string;
  localiteId?: number;
  localiteNom?: string;
  paysId?: number;
  paysNom?: string;

  documents: DocumentDTO[];
  investissements: InvestissementDTO[];
}

// Optionnel : Mise à jour du résumé si tu l'utilises
export interface ProjetSummary {
  id: number;
  poster?: string;
  libelle: string;
  description?: string;
  montantCollecte: number;
  objectifFinancement: number;
  currencyCode: string; // Ajouté ici aussi
  partsPrises: number;
  partsDisponible: number;
  prixUnePart: number;
  statutProjet: StatutProjet;
  createdAt: string;
  localiteNom: string;
  paysNom: string;
  secteurNom?: string;
  siteNom?: string;
}

// Pour créer/éditer un projet
export interface ProjetCreateRequest {
  libelle: string;
  description: string;
  valuation: number;
  roiProjete: number;
  partsDisponible: number;
  prixUnePart: number;
  objectifFinancement: number;
  currencyCode: string; // Ajouté pour permettre le choix à la création
  dateDebut?: string;
  dateFin?: string;
  siteId?: number;
  secteurId?: number;
}
