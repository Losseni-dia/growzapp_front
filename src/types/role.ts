// src/types/role.ts → VERSION FINALE (18 NOVEMBRE 2025)
export type RoleDTO = "ADMIN" | "PORTEUR" | "USER" | "INVESTISSEUR" | "AGENT";

// Pour garder la compatibilité avec les anciens imports si tu en avais
export type Role = RoleDTO;

// Optionnel : si tu veux un objet complet plus tard (ex: avec id)
export interface RoleWithId {
  id: number;
  role: RoleDTO;
}

// Export par défaut pour simplicité
export default RoleDTO;
