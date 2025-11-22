// src/types/common.ts → LA PAGE RESPONSE UNIVERSELLE QUI MARCHE AVEC SPRING BOOT
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // page actuelle (0-based)
  size: number; // taille de page
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
