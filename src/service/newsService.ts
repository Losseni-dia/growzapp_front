// src/service/newsService.ts
import { api } from "./Api";

export interface News {
  id: number;
  title: string;
  content: string;
  imageUrl: string;
  category: string; // string au lieu d'union type — permet les catégories personnalisées
  createdAt: string;
  auteurNom?: string;
}

// Catégories prédéfinies — mais l'utilisateur peut aussi en saisir une nouvelle
export const NEWS_CATEGORIES = [
  { key: "PLATFORM_UPDATE", label: "Platform Update" },
  { key: "INVESTMENT_OPPORTUNITY", label: "Investment Opportunity" },
  { key: "PERFORMANCE_REPORT", label: "Performance Report" },
  { key: "EDUCATION", label: "Éducation" },
  { key: "SECURITY", label: "Sécurité" },
];

export const newsService = {
  getAll: (category?: string) =>
    api.get<any>(category ? `/api/news?category=${category}` : "/api/news"),

  getById: (id: string | number) => api.get<any>(`/api/news/${id}`),

  create: (data: any) => api.post("/api/news", data),

  uploadImage: (formData: FormData) =>
    api.post<{ url: string }>("/api/news/upload", formData, true),

  update: (id: number | string, data: any) => api.put(`/api/news/${id}`, data),

  delete: (id: number | string) => api.delete(`/api/news/${id}`),

  getRssUrl: () => "/api/news/rss",
};

export default newsService;
