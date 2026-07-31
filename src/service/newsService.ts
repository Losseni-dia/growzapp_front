// src/service/newsService.ts
import { api } from "./Api";

export interface News {
  id: number;
  title: string;
  content: string;
  imageUrl: string;
  category: string;
  createdAt: string;
  auteurNom?: string;
}

export const NEWS_CATEGORIES = [
  { key: "PLATFORM_UPDATE", label: "Platform Update" },
  { key: "INVESTMENT_OPPORTUNITY", label: "Investment Opportunity" },
  { key: "PERFORMANCE_REPORT", label: "Performance Report" },
  { key: "EDUCATION", label: "Éducation" },
  { key: "SECURITY", label: "Sécurité" },
];

// Les réponses backend sont désormais enveloppées ({success, message, data})
// — ce service extrait .data pour que les pages consommatrices n'aient
// rien à changer (ARCH-05).
interface ApiWrapped<T> {
  success: boolean;
  message: string;
  data: T;
}

export const newsService = {
  getAll: async (category?: string) => {
    const res = await api.get<ApiWrapped<News[]>>(
      category ? `/api/news?category=${category}` : "/api/news",
    );
    return res.data;
  },
  getById: async (id: string | number) => {
    const res = await api.get<ApiWrapped<News>>(`/api/news/${id}`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post<ApiWrapped<News>>("/api/news", data);
    return res.data;
  },
  uploadImage: async (formData: FormData) => {
    const res = await api.post<ApiWrapped<{ url: string }>>(
      "/api/news/upload",
      formData,
      true,
    );
    return res.data;
  },
  update: async (id: number | string, data: any) => {
    const res = await api.put<ApiWrapped<News>>(`/api/news/${id}`, data);
    return res.data;
  },
  delete: (id: number | string) => api.delete(`/api/news/${id}`),
  getRssUrl: () => "/api/news/rss",
};

export default newsService;
