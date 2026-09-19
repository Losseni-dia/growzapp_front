import type { KycStatus, Sexe, StatutFichePorteur } from "./enum";
import type { InvestissementSummary } from "./investissement";
import type { LocaliteDTO } from "./localite";
import type { ProjetSummary } from "./projet";

export interface WalletSummary {
  soldeDisponible: number;
  soldeBloque: number;
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
  failedLoginAttempts?: number;
  lockedUntil?: string | null;

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
  // === FICHE DE PRÉSENTATION PORTEUR ===
  ficheStatut?: StatutFichePorteur;
  ficheCommentaireRejet?: string;
  dateNaissance?: string;
  adresseResidencielle?: string;
  // ── PRÉFÉRENCES ──────────────────────────────────────────────
  interfaceLanguage?: string; // "fr" | "en" | "es"
  devisePreferee?: string; // "XOF" | "USD" | "EUR" | "XAF" | ...
  // === RÉINITIALISATION ASSISTÉE PAR L'ADMIN ===
  mustChangePassword?: boolean;
  // === SUPPRESSION LOGIQUE (SOFT DELETE) ===
  supprimeLe?: string | null;
  supprimePar?: string | null;
  motifSuppression?: string | null;
}