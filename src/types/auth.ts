// src/types/auth.ts   → CORRIGÉ aussi
import type { RoleDTO } from "./role";

export interface AuthUser {
  id: number;
  login: string;
  prenom: string;
  nom: string;
  email: string;
  image?: string;
  roles: RoleDTO[]; // ← objets complets
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}
