// src/types/porteurDashboard.ts
import type { ValorisationSnapshotDTO } from "./portefeuille";

export interface VelocitePointDTO {
  periode: string; // "2026-03"
  montant: number;
  nombreInvestissements: number;
}

export interface PorteurProjetLigneDTO {
  projetId: number;
  projetLibelle: string;
  projetLibelleTradu?: string;
  projetPoster?: string;
  statutProjet: string;
  objectifFinancement: number;
  montantCollecte: number;
  progressionPourcent: number;
  nombreInvestisseurs: number;
  montantMoyenParInvestisseur: number;
  soldeDisponibleWallet: number;
  soldeBloqueWallet: number;
  totalDividendesVerses: number;
  historiqueCollecte: ValorisationSnapshotDTO[];
  vitesseLevee: VelocitePointDTO[];
}

export interface PorteurDashboardDTO {
  nombreProjets: number;
  totalCollecteTousProjets: number;
  totalInvestisseursTousProjets: number;
  totalDividendesVersesTousProjets: number;
  projets: PorteurProjetLigneDTO[];
}
