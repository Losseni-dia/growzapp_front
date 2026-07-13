// src/types/projet.ts

import type { StatutProjet } from "./enum";
import type { DocumentDTO } from "./document";
import type { InvestissementDTO } from "./investissement";

export interface ProjetDTO {
  id: number;
  slug: string;
  porteurNom?: string;
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

  currencyCode: string;
  certifiedAt?: string;

  dateDebut?: string;
  dateFin?: string;
  dureeMois?: number;
  valeurTotalePartsEnPourcent: number;
  statutProjet: StatutProjet;
  createdAt: string;

  porteurId?: number;

  siteId?: number;
  siteNom?: string;
  secteurId?: number;
  secteurNom?: string;
  localiteId?: number;
  localiteNom?: string;
  paysId?: number;
  paysNom?: string;
  googleMapsUrl?: string;

  documents: DocumentDTO[];
  investissements: InvestissementDTO[];

  // ── Traductions ──────────────────────────────────────────────
  libelleTradu?: string;
  descriptionTradu?: string;
}

// Optionnel : Mise à jour du résumé si tu l'utilises
export interface ProjetSummary {
  id: number;
  slug: string;
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
  certifiedAt?: string;
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
  dureeMois?: number;
  siteId?: number;
  secteurId?: number;
  certifiedAt?: string;
  googleMapsLink ?: string;
}


// Helper — retourne le libellé traduit si disponible, sinon le libellé original
export const getProjetLibelle = (projet: ProjetDTO | ProjetSummary): string => {
  if ("libelleTradu" in projet && projet.libelleTradu) return projet.libelleTradu;
  return projet.libelle;
};

// Helper — retourne la description traduite si disponible, sinon la description originale
export const getProjetDescription = (projet: ProjetDTO): string => {
  if (projet.descriptionTradu) return projet.descriptionTradu;
  return projet.description;
};