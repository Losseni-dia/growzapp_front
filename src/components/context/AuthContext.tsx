// src/components/context/AuthContext.tsx → VERSION ULTIME (22 novembre 2025)

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { UserDTO } from "../../types/user";
import toast from "react-hot-toast";

interface AuthContextType {
  user: UserDTO | null;
  login: (token: string, user: UserDTO) => void;
  updateUser: (user: UserDTO) => void; // ← NOUVELLE FONCTION
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
        setUser(data.user);
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

  // NOUVELLE FONCTION → MET À JOUR LE PROFIL SANS TOUCHER AU TOKEN
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
        updateUser, // ← EXPOSÉE
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
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
};
