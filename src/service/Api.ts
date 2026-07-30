import i18n from "../i18n";

const API_BASE = import.meta.env.VITE_API_URL || "";

export const buildFileUrl = (path: string | null | undefined): string => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
};

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
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${API_BASE}${path}`;
  }
  const clean = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  return `${API_BASE}/api/${clean}`;
};

const request = async <T = unknown>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  endpoint: string,
  body?: any,
  isFormData = false
): Promise<T> => {
  const url = buildUrl(endpoint);
  console.log(`API → ${method} ${url}`);
  
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  // Le token n'est plus attaché manuellement — il voyage désormais via le
  // cookie HttpOnly auth_token, envoyé automatiquement par le navigateur
  // grâce à credentials: "include" (HIGH-03, étape 3b).
  if (i18n && i18n.language) {
    headers["Accept-Language"] = i18n.language;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    console.log(`API ← ${response.status} ${response.statusText}`, url);

    // ========================================================================
    // MODIFICATION ICI : Exception pour la vérification de contrat
    // ========================================================================
    if (response.status === 401) {
      const isVerifyRoute = url.includes("/api/contrats/public/verifier-securise");

      if (!isVerifyRoute) {
        console.error("401 Unauthorized – Session expirée sur :", url);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/login";
        throw new Error("Session expirée");
      }
      // Si c'est la route de vérification, on ne fait rien ici, 
      // on laisse la logique d'erreur standard ci-dessous prendre le relais.
    }
    // ========================================================================
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
  const error: any = new Error(msg);
  error.status = response.status;
  throw error;
}

    if (response.status === 204) return {} as T;
    return response.json();
  } catch (err: any) {
    console.error("Erreur réseau ou fetch :", err.message);
    throw err;
  }
};

// Helper pour récupérer la langue active
const getCurrentLangue = (): string => {
  return localStorage.getItem("i18nextLng")?.split("-")[0] || "fr";
};

// Helper pour ajouter le paramètre langue aux URLs projets
export const buildProjetUrl = (url: string): string => {
  const langue = getCurrentLangue();
  if (langue === "fr") return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}langue=${langue}`;
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