// src/types/user.ts
import type { Sexe } from "./enum";
import type { RoleDTO } from "./role";
import type { ProjetSummary } from "./projet";
import type { InvestissementSummary } from "./investissement";
import { LocaliteDTO } from "./localite";

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
  langues?: string[];
  roles: RoleDTO[];

  // MAINTENANT BIEN PRÉSENT ET REQUIRED (car le back le renvoie toujours)
  enabled: boolean;

  projets?: ProjetSummary[];
  investissements?: InvestissementSummary[];
}
