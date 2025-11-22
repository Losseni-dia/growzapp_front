// src/types/enum.ts   → on enlève Role d'ici
export enum Sexe {
  M = "M",
  F = "F",
}

export type StatutProjet =
  | "EN_PREPARATION"
  | "SOUMIS"
  | "VALIDE"
  | "REJETE"
  | "EN_COURS"
  | "TERMINE"
  | "EN_ATTENTE";

// Pour l'affichage joli (fortement recommandé)
export const StatutProjetLabel: Record<StatutProjet, string> = {
  EN_PREPARATION: "En préparation",
  SOUMIS: "En attente de validation",
  VALIDE: "Validé & publié",
  REJETE: "Rejeté",
  EN_COURS: "En cours de financement",
  TERMINE: "Terminé",
  EN_ATTENTE: "En attente",
};

export enum StatutPartInvestissement {
  EN_ATTENTE = "EN_ATTENTE",
  VALIDE = "VALIDE",
  REJETE = "REJETE",
  REMBOURSE = "REMBOURSE",
}

export enum StatutDividende {
  PLANIFIE = "PLANIFIE",
  PAYE = "PAYE",
}

export enum MoyenPaiement {
  VIREMENT = "VIREMENT",
  MOBILE_MONEY = "MOBILE_MONEY",
  CARTE = "CARTE",
}

export enum StatutFacture {
  EMISE = "EMISE",
  PAYEE = "PAYEE",
  ANNULEE = "ANNULEE",
}
