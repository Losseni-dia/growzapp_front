// src/types/projet.ts   → VERSION CORRIGÉE & AMÉLIORÉE
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
  paysNom?: string; // ← AJOUTÉ pour affichage rapide
  documents: DocumentDTO[];
  investissements: InvestissementDTO[];
}

// NOUVEAU ProjetSummary → optimisé pour cartes et listes publiques
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

  // Lieu du projet (beaucoup plus pertinent qu’un nom de porteur anonyme)
  localiteNom: string;
  paysNom: string;

  // Optionnel : si tu veux garder le secteur ou le site
  secteurNom?: string;
  siteNom?: string;
}

// src/types/projet.ts → AJOUTE LES CHAMPS MANQUANTS
export interface ProjetCreateRequest {
  libelle: string;
  description: string;
  valuation: number; // ← OBLIGATOIRE
  roiProjete: number; // ← OBLIGATOIRE
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
