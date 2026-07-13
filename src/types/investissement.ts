import { DividendeDTO } from "./dividende";
import { StatutPartInvestissement } from "./enum";

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

  montantInvesti: number;
  projetPoster?: string;
  numeroContrat?: string;

  // AJOUTÉ – L’URL DU VRAI PDF
  contratUrl?: string;

  // Dividendes
  dividendes: DividendeDTO[];
  montantTotalPercu: number;
  montantTotalPlanifie: number;
  roiRealise: number;
  dividendesPayes: number;
  dividendesPlanifies: number;
  statutGlobalDividendes: string;

  googleMapsUrl: string; // Ajouté pour le lien Google Maps

  projetLibelleTradu?: string;
}

export interface InvestissementSummary {
  id: number;
  projetLibelle: string;
  montantInvesti: number;
  date: string;
  nombrePartsPris: number;
  prixUnePart: number;
  statutPartInvestissement: StatutPartInvestissement;
  projetLibelleTradu?: string;
}
