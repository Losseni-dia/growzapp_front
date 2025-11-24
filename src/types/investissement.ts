// src/types/investissement.ts
import type { StatutPartInvestissement } from "./enum";
import type { DividendeDTO } from "./dividende";

export interface InvestissementDTO {
  id: number;
  nombrePartsPris: number;
  date: string;
  valeurPartsPrisEnPourcent: number;
  frais: number;
  statutPartInvestissement: StatutPartInvestissement;
  investisseurId?: number;
  investisseurNom?: string;
  projetId?: number;
  projetLibelle?: string;
  prixUnePart: number;
  dividendes: DividendeDTO[];
  montantTotalPercu: number;
  montantTotalPlanifie: number;
  roiRealise: number;
  dividendesPayes: number;
  dividendesPlanifies: number;
  statutGlobalDividendes: string;
}

export interface InvestissementSummary {
  id: number;
  projetId: number;
  nombrePartsPris: number;
  prixUnePart: number;
  projetLibelle: string;
  montantInvesti: number;
  montantPercu: number;
  statutPartInvestissement: StatutPartInvestissement;
}

export interface InvestirRequest {
  projetId: number;
  nombreParts: number;
}
