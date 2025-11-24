// src/types/wallet.ts
export interface WalletDTO {
  soldeDisponible: number;
  soldeBloque: number;
  soldeTotal?: number; // optionnel, calculé côté front
}
