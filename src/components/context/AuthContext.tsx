// src/components/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { UserDTO } from "../../types/user";
import toast from "react-hot-toast";

// 1. Définition de l'interface du contexte
export interface AuthContextType {
  user: UserDTO | null;
  login: (token: string, user: UserDTO) => void;
  updateUserInfo: (user: UserDTO) => void; // Nom harmonisé
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);

  // 2. Récupération de la session au démarrage
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      setLoading(false);
      return;
    }

    try {
      const data = JSON.parse(stored);
      if (data?.token && data?.user) {
        setUser(data.user as UserDTO);
      }
    } catch (err) {
      console.error("Erreur parsing user storage", err);
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. Fonction de Connexion
  const login = (token: string, userData: UserDTO) => {
    const safeUser = { ...userData, enabled: userData.enabled ?? true };
    // On stocke l'objet complet pour la persistance au rafraîchissement
    localStorage.setItem("user", JSON.stringify({ token, user: safeUser }));
    // On stocke le token seul pour les intercepteurs API
    localStorage.setItem("access_token", token);
    setUser(safeUser);
    
  };

  // 4. Fonction de mise à jour du profil (Correctement renommée)
  const updateUserInfo = (userData: UserDTO) => {
    const safeUser = { ...userData, enabled: userData.enabled ?? true };
    const current = localStorage.getItem("user");

    if (current) {
      try {
        const parsed = JSON.parse(current);
        // On met à jour l'utilisateur dans le localStorage sans perdre le token
        localStorage.setItem(
          "user",
          JSON.stringify({ ...parsed, user: safeUser })
        );
      } catch (err) {
        console.error("Erreur mise à jour localStorage", err);
      }
    }

    setUser(safeUser);
    // Note : le toast est optionnel ici car souvent géré par le composant qui appelle
  };

  // 5. Fonction de Déconnexion
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    setUser(null);
    toast.success("Déconnexion réussie");
    // Redirection propre
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        updateUserInfo,
        logout,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// 6. Hook personnalisé pour utiliser le contexte
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
};
