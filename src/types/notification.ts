// src/types/notification.ts

export interface Notification {
  id: number;
  title: string;
  content: string;
  date: string; // Reçu en ISO string depuis Spring Boot (ex: "2024-05-20T10:00:00")
  read: boolean;
  projetId?: number;
  projetSlug?: string; 
}