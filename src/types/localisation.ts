// src/types/localisation.ts
export interface LocalisationDTO {
  id: number;
  nom: string;
  adresse?: string;
  contact?: string;
  responsable?: string;
  createdAt: string;
  localiteNom?: string;
  localiteId?: number;
  paysNom?: string;
  projets?: string[];
}
