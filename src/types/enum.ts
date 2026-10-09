// src/types/enum.ts → VERSION FINALE ULTIME (24 NOV 2025)

export enum Sexe {
  M = "M",
  F = "F",
}

// === PROJET ===
export type StatutProjet =
  | "BROUILLON"
  | "EN_PREPARATION"
  | "SOUMIS"
  | "VALIDE"
  | "REJETE"
  | "EN_COURS"
  | "TERMINE"
  | "EN_ATTENTE"
  | "FINANCE"
  | "ECHEC_FINANCEMENT";

export const StatutProjetLabel: Record<StatutProjet, string> = {
  BROUILLON: "Brouillon",
  EN_PREPARATION: "En préparation",
  SOUMIS: "En attente de validation",
  VALIDE: "Validé & publié",
  REJETE: "Rejeté",
  EN_COURS: "En cours de financement",
  TERMINE: "Terminé",
  EN_ATTENTE: "En attente",
  FINANCE: "Financé",
  ECHEC_FINANCEMENT: "Échec — objectif non atteint",
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
  | "TRANSFER_IN"
  | "PAYOUT_STRIPE"
  | "DIVIDENDE"
  | "RETRAIT_EXTERNE"
  // Reste de l'enum backend TypeTransaction.java — élargi au fil des
  // modules (wallet projet, Premium, Fournisseur, GrowzMarket).
  | "PAIEMENT_STRIPE"
  | "PAIEMENT_OM"
  | "PAIEMENT_MTN"
  | "PAIEMENT_WAVE"
  | "PAYOUT_OM"
  | "PAYOUT_MTN"
  | "PAYOUT_WAVE"
  | "PAYOUT_OM_SN"
  | "PAYOUT_WAVE_SN"
  | "PAYOUT_MOOV"
  | "PAYOUT_BANK"
  | "CREDIT_PROJET"
  | "VIREMENT_PORTEUR"
  | "RETRAIT_MOBILE_MONEY"
  | "VERSEMENT_PORTEUR"
  | "VERSEMENT_DIVIDENDE"
  | "DIVIDENDE_ENTRANT"
  | "DIVIDENDE_SORTANT"
  | "RETRAIT_ADMIN"
  | "DEBLOCAGE_PROJET"
  | "TRANSFER_PROJET_VERS_PERSONNEL"
  | "TRANSFER_PERSONNEL_VERS_PROJET"
  | "RETRAIT_PROJET"
  | "PREMIUM_PROJET"
  | "PAIEMENT_FOURNISSEUR"
  | "VENTE_MARKET";

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
  RETRAIT_EXTERNE: "Retrait_externe",
  PAYOUT_STRIPE: "Stripe",
  DIVIDENDE: "Dividende",
  PAIEMENT_STRIPE: "Paiement carte",
  PAIEMENT_OM: "Paiement Orange Money",
  PAIEMENT_MTN: "Paiement MTN MoMo",
  PAIEMENT_WAVE: "Paiement Wave",
  PAYOUT_OM: "Retrait Orange Money",
  PAYOUT_MTN: "Retrait MTN MoMo",
  PAYOUT_WAVE: "Retrait Wave",
  PAYOUT_OM_SN: "Retrait Orange Money",
  PAYOUT_WAVE_SN: "Retrait Wave",
  PAYOUT_MOOV: "Retrait Moov Money",
  PAYOUT_BANK: "Retrait bancaire",
  CREDIT_PROJET: "Crédit projet",
  VIREMENT_PORTEUR: "Virement au porteur",
  RETRAIT_MOBILE_MONEY: "Retrait Mobile Money",
  VERSEMENT_PORTEUR: "Versement au porteur",
  VERSEMENT_DIVIDENDE: "Versement de dividende",
  DIVIDENDE_ENTRANT: "Dividende reçu",
  DIVIDENDE_SORTANT: "Dividende distribué",
  RETRAIT_ADMIN: "Retrait (admin)",
  DEBLOCAGE_PROJET: "Déblocage de trésorerie",
  TRANSFER_PROJET_VERS_PERSONNEL: "Transfert projet → personnel",
  TRANSFER_PERSONNEL_VERS_PROJET: "Transfert personnel → projet",
  RETRAIT_PROJET: "Retrait projet",
  PREMIUM_PROJET: "Statut Premium",
  PAIEMENT_FOURNISSEUR: "Paiement fournisseur",
  VENTE_MARKET: "Vente GrowzMarket",
};


export enum KycStatus {
  NON_SOUMIS = "NON_SOUMIS",
  EN_ATTENTE = "EN_ATTENTE",
  VALIDE = "VALIDE",
  REJETE = "REJETE"
}

export enum KycStatusLabel {
  NON_SOUMIS = "Non vérifié",
  EN_ATTENTE = "En attente",
  VALIDE = "Vérifié",
  REJETE = "Rejeté"
}

export enum StatutFichePorteur {
  NON_SOUMISE = "NON_SOUMISE",
  EN_ATTENTE = "EN_ATTENTE",
  VALIDEE = "VALIDEE",
  REJETEE = "REJETEE"
}

export enum StatutJuridiquePorteur {
  INDIVIDUEL = "INDIVIDUEL",
  SOCIETE = "SOCIETE"
}

