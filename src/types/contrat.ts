// src/types/contrat.ts
export interface ContratDTO {
  id: number;
  numeroContrat?: string;
  dateSignature?: string;
  fichierUrl?: string;
  statut?: "EN_COURS" | "SIGNE" | "ANNULE";
  investissementId: number;
}
