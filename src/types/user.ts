// src/types/user.ts → VERSION FINALE ULTIME 2025
import type { Sexe } from "./enum";
import type { RoleDTO } from "./role";
import type { ProjetSummary } from "./projet";
import type { InvestissementSummary } from "./investissement";
import type { LocaliteDTO } from "./localite";

export interface WalletSummary {
  soldeDisponible: number;
  soldeBloque: number;
  soldeRetirable: number;
  soldeTotal?: number; // optionnel, calculé côté front si besoin
}

export interface UserDTO {
  id: number;
  image?: string;
  login: string;
  prenom: string;
  nom: string;
  sexe: Sexe;
  email: string;
  contact?: string;
  localite?: LocaliteDTO | null;
  langues: { id: number; nom: string }[];
  roles: RoleDTO[];

  // Toujours présent
  enabled: boolean;

  // Wallet intégré — propre, clair, pro
  wallet: WalletSummary;

  projets?: ProjetSummary[];
  investissements?: InvestissementSummary[];
}
