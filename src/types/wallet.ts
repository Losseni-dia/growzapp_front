// src/types/wallet.ts

export interface WalletDTO {
  id: number;
  soldeDisponible: number;
  soldeBloque: number;
  soldeTotal?: number; // optionnel si tu le renvoies
}
