// src/services/notificationService.ts
import { api } from "../service/Api"; // Importe l'objet exporté
import { Notification } from "../types/notification"; 

export const notificationService = {
  // Liste complète
  getAll: async () => {
    // Avec ton utilitaire fetch personnalisé, le .get() retourne directement le JSON (T)
    return await api.get<Notification[]>("notifications");
  },

  // Juste le chiffre pour la bulle rouge
  getUnreadCount: async () => {
    return await api.get<number>("notifications/unread-count");
  },

  // Marquer comme lu au clic
  markAsRead: async (id: number) => {
    return await api.patch(`notifications/${id}/read`);
  }
};