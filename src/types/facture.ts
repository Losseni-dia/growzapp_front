// src/types/facture.ts
import type { StatutFacture } from "./enum";

export interface FactureDTO {
  id: number;
  numeroFacture: string;
  montantHT: number;
  tva: number;
  montantTTC: number;
  dateEmission: string;
  datePaiement?: string;
  statut: StatutFacture;
  dividendeId: number;
  investisseurId?: number;
  investisseurNom?: string;
  fichierUrl?: string;
}
