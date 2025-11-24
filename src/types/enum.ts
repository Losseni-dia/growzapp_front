// src/types/enum.ts → VERSION FINALE ULTIME (24 NOV 2025)

export enum Sexe {
  M = "M",
  F = "F",
}

// === PROJET ===
export type StatutProjet =
  | "EN_PREPARATION"
  | "SOUMIS"
  | "VALIDE"
  | "REJETE"
  | "EN_COURS"
  | "TERMINE"
  | "EN_ATTENTE";

export const StatutProjetLabel: Record<StatutProjet, string> = {
  EN_PREPARATION: "En préparation",
  SOUMIS: "En attente de validation",
  VALIDE: "Validé & publié",
  REJETE: "Rejeté",
  EN_COURS: "En cours de financement",
  TERMINE: "Terminé",
  EN_ATTENTE: "En attente",
};

// === INVESTISSEMENT ===
export enum StatutPartInvestissement {
  EN_ATTENTE = "EN_ATTENTE",
  VALIDE = "VALIDE",
  REJETE = "REJETE",
  REMBOURSE = "REMBOURSE",
}

// === DIVIDENDE ===
export enum StatutDividende {
  PLANIFIE = "PLANIFIE",
  PAYE = "PAYE",
}

// === PAIEMENT ===
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

// =========================================================
// AJOUTÉS POUR LE WALLET – OBLIGATOIRES POUR TransactionDTO
// =========================================================

/** Type de transaction financière */
export type TypeTransaction =
  | "DEPOT"
  | "RETRAIT"
  | "INVESTISSEMENT"
  | "REMBOURSEMENT"
  | "TRANSFER_OUT"
  | "TRANSFER_IN";

/** Statut d'une transaction */
export type StatutTransaction =
  | "EN_COURS"
  | "SUCCESS"
  | "FAILED"
  | "EN_ATTENTE_VALIDATION"
  | "REJETEE";

/** Labels jolis pour l'affichage (optionnel mais fortement recommandé) */
export const StatutTransactionLabel: Record<StatutTransaction, string> = {
  EN_COURS: "En cours",
  SUCCESS: "Succès",
  FAILED: "Échoué",
  EN_ATTENTE_VALIDATION: "En attente de validation",
  REJETEE: "Rejeté",
};

export const TypeTransactionLabel: Record<TypeTransaction, string> = {
  DEPOT: "Dépôt",
  RETRAIT: "Retrait",
  INVESTISSEMENT: "Investissement",
  REMBOURSEMENT: "Remboursement",
  TRANSFER_OUT: "Transfert envoyé",
  TRANSFER_IN: "Transfert reçu",
};

