// src/components/context/AuthContext.tsx
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "../../service/Api"; // Assure-toi que l'import de ton service api est correct
import { UserDTO } from "../../types/user";
import i18n from "../../i18n";

// 1. Définition de l'interface du contexte mise à jour
export interface AuthContextType {
  user: UserDTO | null;
  login: (token: string, user: UserDTO) => void;
  updateUserInfo: (user: UserDTO) => void;
  reloadUser: () => Promise<void>; // <-- AJOUTÉ
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);

  // 2. Récupération de la session au démarrage (Version Robuste)
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      setLoading(false);
      return;
    }
    try {
      const data = JSON.parse(stored);
      let loadedUser: UserDTO | null = null;

      if (data?.user) {
        loadedUser = data.user as UserDTO;
      } else if (data?.id || data?.email) {
        loadedUser = data as UserDTO;
      }

      if (loadedUser) {
        setUser(loadedUser);

        // ── Restaurer langue préférée ──────────────────────
        if (loadedUser.interfaceLanguage) {
          i18n.changeLanguage(loadedUser.interfaceLanguage);
        }

        // ── Restaurer devise préférée ──────────────────────
        if (loadedUser.devisePreferee) {
          localStorage.setItem("user_currency", loadedUser.devisePreferee);
        }
      }
    } catch (err) {
      console.error("Erreur parsing user storage", err);
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. Fonction de Connexion
  const login = (_token: string, userData: UserDTO) => {
    const safeUser = { ...userData, enabled: userData.enabled ?? true };
    // Le token n'est plus stocké côté client — il vit désormais uniquement
    // dans le cookie HttpOnly posé par le backend, inaccessible à JavaScript
    // (protection contre le vol de token via XSS, HIGH-03 de l'audit).
    localStorage.setItem("user", JSON.stringify({ user: safeUser }));
    setUser(safeUser);

    // ── Appliquer langue préférée ──────────────────────────────
    if (safeUser.interfaceLanguage) {
      i18n.changeLanguage(safeUser.interfaceLanguage);
      localStorage.setItem("i18nextLng", safeUser.interfaceLanguage);
    }

    // ── Appliquer devise préférée ──────────────────────────────
    if (safeUser.devisePreferee) {
      localStorage.setItem("user_currency", safeUser.devisePreferee);
    }
  };

  // 4. Fonction de mise à jour du profil (locale)
  const updateUserInfo = (userData: UserDTO) => {
    const safeUser = { ...userData, enabled: userData.enabled ?? true };
    const current = localStorage.getItem("user");

    if (current) {
      try {
        const parsed = JSON.parse(current);
        localStorage.setItem(
          "user",
          JSON.stringify({ ...parsed, user: safeUser }),
        );
      } catch (err) {
        console.error("Erreur mise à jour localStorage", err);
      }
    }
    setUser(safeUser);
  };

  // 5. AJOUT : Fonction Reload (Appel API pour synchroniser le statut KYC)
  const reloadUser = async () => {
    try {
      // On récupère les données fraîches depuis le serveur
      const freshUser = await api.get<UserDTO>("/api/auth/me");
      if (freshUser) {
        updateUserInfo(freshUser);
        console.log("Données utilisateur rafraîchies :", freshUser.kycStatus);
      }
    } catch (err) {
      console.error("Erreur lors du rafraîchissement de l'utilisateur", err);
    }
  };

  // 6. Fonction de Déconnexion
  const logout = () => {
    // Révoque le token côté serveur (invalide le cookie HttpOnly) avant de
    // nettoyer l'état local — voir HIGH-02 (endpoint /api/auth/logout)
    api.post("/api/auth/logout").catch(() => {});
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        updateUserInfo,
        reloadUser, // <-- EXPOSÉ ICI
        logout,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
};
