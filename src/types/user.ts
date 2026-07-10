import type { KycStatus, Sexe } from "./enum";
import type { InvestissementSummary } from "./investissement";
import type { LocaliteDTO } from "./localite";
import type { ProjetSummary } from "./projet";

export interface WalletSummary {
  soldeDisponible: number;
  soldeBloque: number;
  soldeRetirable: number;
  soldeTotal?: number;
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

  // Modifié pour correspondre à l'usage .includes() dans vos composants
  roles: string[];

  enabled: boolean;
  wallet: WalletSummary;

  projets?: ProjetSummary[];
  investissements?: InvestissementSummary[];

  // === CHAMPS KYC COMPLETS ===
  kycStatus: KycStatus;
  kycNumeroPiece?: string; // <-- AJOUTÉ
  kycDateDelivrance?: string; // <-- AJOUTÉ
  kycDateExpiration?: string; // <-- AJOUTÉ
  kycRectoUrl?: string; // <-- AJOUTÉ
  kycVersoUrl?: string; // <-- AJOUTÉ
  kycSelfieUrl?: string; // <-- AJOUTÉ
  kycCommentaireRejet?: string;
  dateNaissance?: string;
  adresseResidencielle?: string;
  // ── PRÉFÉRENCES ──────────────────────────────────────────────
  interfaceLanguage?: string; // "fr" | "en" | "es"
  devisePreferee?: string; // "XOF" | "USD" | "EUR" | "XAF" | ...
}