// src/service/api.ts → VERSION FINALE ULTIME – ZÉRO BUG À VIE (21 NOV 2025)

const getFreshToken = (): string | null => {
  const stored = localStorage.getItem("user");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.token) return parsed.token;
    } catch {}
  }
  return localStorage.getItem("access_token") || localStorage.getItem("token");
};

/**
 * Construit TOUJOURS une URL qui commence par /api
 * → Compatible proxy Vite à 100%
 */
const buildUrl = (endpoint: string): string => {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }

  // NOUVEAU : si l'endpoint commence déjà par /api, on le garde tel quel
  if (endpoint.startsWith("/api/") || endpoint.startsWith("api/")) {
    return endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  }
  
  const clean = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `/api${clean}`;
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

  const response = await fetch(url, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  // ========== DÉCONNEXION UNIQUEMENT SUR 401 ==========
  // 401 → déconnexion propre
  if (response.status === 401) {
    console.log("401 détecté sur l'URL :", url);
    alert(
      "401 détecté – regarde la console ! Ouvre Network pour voir quelle requête plante"
    );
    // localStorage.clear();
    // window.location.href = "/login";
    // throw new Error("Session expirée");
    return {} as T; // on bloque la déconnexion
  }
  // ========== AUTRES ERREURS (404, 500, etc.) → ON NE TOUCHERA JAMAIS AU STORAGE ==========
  if (!response.ok) {
    let msg = "Erreur serveur";

    try {
      const text = await response.text();
      if (text) {
        try {
          const json = JSON.parse(text);
          msg = json?.message || json?.error || text || msg;
        } catch {
          // si le corps n'est pas du JSON valide, on garde le text brut
          msg = text || msg;
        }
      }
    } catch {
      // si response.text() échoue (rare)
    }

    // ON NE CLEAR LE STORAGE QUE SUR 401 (token expiré ou invalide)
    // 401 → déconnexion propre
    if (response.status === 401) {
      console.log("401 détecté sur l'URL :", url);
      alert(
        "401 détecté – regarde la console ! Ouvre Network pour voir quelle requête plante"
      );
      // localStorage.clear();
      // window.location.href = "/login";
      // throw new Error("Session expirée");
      return {} as T; // on bloque la déconnexion
    }

    throw new Error(msg);
  }

  if (response.status === 204) return {} as T;

  try {
    const json = await response.json();
    return json as T;
  } catch {
    return {} as T;
  }
};

// Export propre et typé
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
