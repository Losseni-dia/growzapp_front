// src/types/portefeuille.ts

export type TypeEvenementValorisation =
  | "CREATION"
  | "VALIDATION"
  | "INVESTISSEMENT"
  | "DIVIDENDE";

export interface ValorisationSnapshotDTO {
  date: string; // ISO LocalDateTime
  montantValorisation: number;
  montantCollecte: number;
  typeEvenement: TypeEvenementValorisation;
  montantEvenement: number | null;
}

export interface DividendeSnapshotDTO {
  id: number;
  datePaiement: string | null; // ISO LocalDate
  montantTotal: number;
  statutDividende: string;
  motif: string | null;
}

export interface PortefeuilleLigneDTO {
  investissementId: number;
  projetId: number;
  projetLibelle: string;
  projetLibelleTradu?: string;
  projetPoster?: string;
  statutProjet: string;
  dateInvestissement: string; // ISO
  nombrePartsPris: number;
  pourcentageDetenu: number;
  montantInvesti: number;
  valorisationActuelle: number;
  valeurPositionActuelle: number;
  performancePourcent: number;
  dividendesPercus: number;
  historiqueValorisation: ValorisationSnapshotDTO[];
  dividendesDetail: DividendeSnapshotDTO[];
}

export interface PortefeuilleDTO {
  totalInvesti: number;
  valeurActuelleTotale: number;
  totalDividendesPercus: number;
  performanceGlobalePourcent: number;
  nombrePositions: number;
  lignes: PortefeuilleLigneDTO[];
}
