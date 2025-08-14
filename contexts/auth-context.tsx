"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

const AuthContext = createContext<any>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setToken(data.token || null);
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log("Fazendo login...");

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      console.log("Status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Login OK:", data);
        setToken(data.token); // salva no state
        document.cookie = `auth-token=${data.token}; path=/`; // garante cookie caso não venha
        setUser(data.user);
        return true;
      } else {
        console.log("Login falhou");
        return false;
      }
    } catch (error) {
      console.error("Erro login:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Chamar API de logout para limpar sessão no servidor
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    } finally {
      // Limpar estado local
      setUser(null);
      setToken(null);
      // Limpar cookie
      document.cookie =
        "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  };
  const hasPermission = () => true;

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        hasPermission,
        isAuthenticated: !!user,
        isLoading,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// export { getUserRoleLabel }
