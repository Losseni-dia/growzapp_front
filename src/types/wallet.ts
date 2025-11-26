// src/types/wallet.ts → VERSION FINALE 2025 (avec soldeRetirable)

export interface WalletDTO {
  id: number;
  soldeDisponible: number;
  soldeBloque: number;
  soldeRetirable: number; // NOUVEAU CHAMP
  soldeTotal?: number; // optionnel si tu le renvoies
}
