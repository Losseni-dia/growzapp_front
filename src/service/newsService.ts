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

  // FIX : On passe 'true' pour activer isFormData dans ton Api.ts
  uploadImage: (formData: FormData) => 
    api.post<{ url: string }>("/news/upload", formData, true), 
  
  update: (id: number | string, data: any) => api.put(`/news/${id}`, data),
  
  delete: (id: number | string) => api.delete(`/news/${id}`),

  getRssUrl: () => "/api/news/rss"
};

export default newsService;