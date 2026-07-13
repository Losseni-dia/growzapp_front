// src/services/notificationService.ts
import { api } from "../service/Api"; // Importe l'objet exporté
import { Notification } from "../types/notification";

export const notificationService = {
  getAll: async () => {
    // Ton api.get retourne déjà le JSON, on accède à .data qui contient la liste
    const response = await api.get<any>("notifications");
    return response.data as Notification[];
  },

  getUnreadCount: async () => {
    const response = await api.get<any>("notifications/unread-count");
    return response.data as number;
  },

  markAsRead: async (id: number) => {
    return await api.patch(`notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    return await api.patch(`notifications/read-all`);
  },
};

export default notificationService; // Export par défaut
