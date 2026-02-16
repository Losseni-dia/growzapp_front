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
  // Récupérer toutes les news (avec filtre optionnel)
  getAll: (category?: string) => 
    api.get<News[]>(category ? `/news?category=${category}` : "/news"),

  // Récupérer un article précis
  getById: (id: string | number) => 
    api.get<News>(`/news/${id}`),

  // Récupérer le lien du flux RSS
  getRssUrl: () => "/api/news/rss"
};

export default newsService;