// src/types/adminGlobalDashboard.ts

export interface VelocitePointDTO {
  periode: string; // "2026-03"
  montant: number;
  nombreInvestissements: number;
}

export interface GlobalKpiDTO {
  totalCollecte: number;
  totalObjectif: number;
  tauxCompletionGlobal: number;
  countUsers: number;
  countInvestisseursUniques: number;
  countProjetsActifs: number;
  countInvestissements: number;
  montantMoyenInvestissement: number;
}

export interface TopProjetDTO {
  projetId: number;
  libelle: string;
  libelleTradu?: string;
  poster?: string;
  montantCollecte: number;
  objectifFinancement: number;
  progressionPourcent: number;
}

export interface AdminGlobalDashboardDTO {
  kpis: GlobalKpiDTO;
  evolutionInvestissements: VelocitePointDTO[];
  repartitionParSecteur: Record<string, number>;
  repartitionParStatut: Record<string, number>;
  topProjetsParCollecte: TopProjetDTO[];
  topProjetsParProgression: TopProjetDTO[];
  totalDividendesVerses: number;
  countDividendesVerses: number;
  evolutionDividendes: VelocitePointDTO[];
}
