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

// Type du contexte — on utilise directement UserDTO
export interface AuthContextType {
  user: UserDTO | null;
  login: (token: string, user: UserDTO) => void;
  updateUser: (user: UserDTO) => void;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);

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

  const login = (token: string, userData: UserDTO) => {
    const safeUser = { ...userData, enabled: userData.enabled ?? true };
    localStorage.setItem("user", JSON.stringify({ token, user: safeUser }));
    localStorage.setItem("access_token", token);
    setUser(safeUser);
    toast.success(`Bienvenue ${safeUser.prenom} !`);
  };

  const updateUser = (userData: UserDTO) => {
    const safeUser = { ...userData, enabled: userData.enabled ?? true };
    const current = localStorage.getItem("user");
    if (current) {
      try {
        const parsed = JSON.parse(current);
        localStorage.setItem(
          "user",
          JSON.stringify({ ...parsed, user: safeUser })
        );
      } catch {}
    }
    setUser(safeUser);
    toast.success("Profil mis à jour !");
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    setUser(null);
    toast.success("Déconnexion réussie");
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        updateUser,
        logout,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook dédié (à importer partout)
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
};
