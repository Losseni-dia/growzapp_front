// src/types/dividende.ts
import type { StatutDividende, MoyenPaiement } from "./enum";

export interface DividendeDTO {
  id: number;
  montantParPart: number; // BigDecimal → number en JS
  statutDividende: StatutDividende;
  moyenPaiement: MoyenPaiement; // ← Rendu obligatoire (ou ? si tu veux garder optionnel)
  datePaiement?: string | null; // LocalDate → string ou null
  investissementId: number | null; // nullable si pas toujours présent
  investissementInfo: string;
  montantTotal: number; // BigDecimal → number
  fileName?: string | null; // optionnel
  factureUrl?: string | null; // ← AJOUTÉ : l'URL directe du PDF
}
