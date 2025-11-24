// src/types/transaction.ts → VERSION 100% SYNCHRO AVEC LE BACKEND

import type { TypeTransaction, StatutTransaction } from "./enum";

export interface TransactionDTO {
  id: number;
  montant: number;
  type: TypeTransaction;
  statut: StatutTransaction;
  createdAt: string;
  completedAt?: string | null;
  description?: string | null;

  // === Infos du propriétaire du wallet (toujours présent) ===
  userId: number;
  userPrenom: string;
  userNom: string;
  userLogin: string;

  // === Pour les transferts ===
  destinataireUserId?: number | null;
  destinataireNomComplet?: string | null;
  destinataireLogin?: string | null;

  expediteurUserId?: number | null;
  expediteurNomComplet?: string | null;
  expediteurLogin?: string | null;
}
