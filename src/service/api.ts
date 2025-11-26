// src/service/api.ts → VERSION FINALE ULTIME 2025 (getFreshToken EXPORTÉ)

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

// EXPORT OBLIGATOIRE → C’EST LA SEULE LIGNE QUI MANQUAIT
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

  const headers: Record<string, string> = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (response.status === 401) {
      console.error("401 Unauthorized sur :", url);
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

    const json = await response.json();
    return json as T;
  } catch (err: any) {
    if (err.message) throw err;
    throw new Error("Erreur réseau");
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
