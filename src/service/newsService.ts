// src/service/newsService.ts
import { api } from "./Api";

export interface News {
  id: number;
  title: string;
  content: string;
  imageUrl: string;
  category: "PLATFORM_UPDATE" | "INVESTMENT_OPPORTUNITY" | "PERFORMANCE_REPORT" | "EDUCATION" | "SECURITY";
  createdAt: string;
}

export const newsService = {
  getAll: (category?: string) => 
    api.get<News[]>(category ? `/news?category=${category}` : "/news"),

  getById: (id: string | number) => 
    api.get<News>(`/news/${id}`),

  create: (data: any) => api.post("/news", data),

  /**
   * FIX: Si ton api.post n'accepte pas d'objet config en 3ème paramètre,
   * utilise directement Axios ou vérifie la signature dans Api.ts.
   * Généralement, pour le multipart, Axios gère le Content-Type automatiquement.
   */
  uploadImage: (formData: FormData) => 
    api.post<{ url: string }>("/news/upload", formData), 

  getRssUrl: () => "/api/news/rss"
};

export default newsService;