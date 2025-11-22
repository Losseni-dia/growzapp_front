// src/types/dividende.ts
import type { StatutDividende, MoyenPaiement } from "./enum";

export interface DividendeDTO {
  id: number;
  montantParPart: number;
  statutDividende: StatutDividende;
  moyenPaiement?: MoyenPaiement;
  datePaiement?: string;
  investissementId?: number;
  investissementInfo: string;
  montantTotal: number;
  fileName?: string;
}
