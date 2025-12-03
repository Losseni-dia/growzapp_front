// src/types/projet.ts → VERSION 100% PROPRE & COHÉRENTE – 27 NOV 2025

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

// Résumé pour les cartes publiques (optionnel, tu peux garder)
export interface ProjetSummary {
  id: number;
  poster?: string;
  libelle: string;
  description?: string;
  montantCollecte: number;
  objectifFinancement: number;
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
  dateDebut?: string;
  dateFin?: string;
  siteId?: number;
  secteurId?: number;
}

export interface ProjetUpdateRequest extends Partial<ProjetCreateRequest> {
  id: number;
}
