// src/service/api.ts

// === AJOUT 1 : On importe juste i18n pour lire la langue actuelle ===
import i18n from "../i18n";
// ===================================================================

const getFreshToken = (): string | null => {
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      const token =
        user?.token ||
        user?.accessToken ||
        user?.jwt ||
        user?.access_token ||
        user?.bearerToken ||
        user?.authToken ||
        user?.["token"] ||
        user?.["access_token"];

      if (token && typeof token === "string" && token.startsWith("ey")) {
        return token;
      }
    }
  } catch (e) {
    console.warn("Impossible de parser localStorage.user", e);
  }

  const fallback =
    localStorage.getItem("token") || localStorage.getItem("access_token");
  if (fallback && fallback.startsWith("ey")) return fallback;

  return null;
};

export { getFreshToken };

const buildUrl = (endpoint: string): string => {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }
  if (endpoint.startsWith("/api") || endpoint.startsWith("api")) {
    return endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  }
  const clean = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  return `/api/${clean}`;
};

const request = async <T = unknown>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  endpoint: string,
  body?: any,
  isFormData = false
): Promise<T> => {
  const token = getFreshToken();
  const url = buildUrl(endpoint);

  console.log(
    `API → ${method} ${url}`,
    token ? "Token présent" : "Pas de token"
  );

  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // === AJOUT 2 : C'est la seule modification dans la logique ===
  // Si i18n est chargé, on ajoute la langue dans l'en-tête
  if (i18n && i18n.language) {
    headers["Accept-Language"] = i18n.language;
  }
  // ===========================================================

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    console.log(`API ← ${response.status} ${response.statusText}`, url);

    if (response.status === 401) {
      console.error("401 Unauthorized – Session expirée sur :", url);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      window.location.href = "/login";
      throw new Error("Session expirée");
    }

    if (!response.ok) {
      let msg = "Erreur serveur";
      try {
        const text = await response.text();
        if (text) {
          try {
            const json = JSON.parse(text);
            msg = json?.message || json?.error || json?.detail || text;
          } catch {
            msg = text;
          }
        }
      } catch {}
      throw new Error(msg);
    }

    if (response.status === 204) return {} as T;
    return response.json();
  } catch (err: any) {
    console.error("Erreur réseau ou fetch :", err.message);
    throw err;
  }
};

export const api = {
  get: <T = unknown>(endpoint: string) => request<T>("GET", endpoint),
  post: <T = unknown>(endpoint: string, body?: any, isFormData = false) =>
    request<T>("POST", endpoint, body, isFormData),
  put: <T = unknown>(endpoint: string, body?: any, isFormData = false) =>
    request<T>("PUT", endpoint, body, isFormData),
  patch: <T = unknown>(endpoint: string, body?: any) =>
    request<T>("PATCH", endpoint, body),
  delete: <T = unknown>(endpoint: string) => request<T>("DELETE", endpoint),
};
