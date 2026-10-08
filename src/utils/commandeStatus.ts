// Statuts terminaux : une commande dans l'un de ces états ne bougera plus et
// bascule dans l'historique, hors de la liste "en cours".
export const STATUTS_TERMINAUX_FOURNISSEUR = ["PAYEE", "REJETEE", "REFUSEE", "ANNULEE"];
export const STATUTS_TERMINAUX_MARKET = ["RETIREE", "ANNULEE"];

export function estTerminal(statut: string, statutsTerminaux: string[]): boolean {
  return statutsTerminaux.includes(statut);
}
