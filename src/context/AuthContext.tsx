import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  user: string | null;
  isAdmin: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedIsAdmin = localStorage.getItem("isAdmin");
    if (storedUser) {
      setUser(storedUser);
      setIsAdmin(storedIsAdmin === "true");
    }
  }, []);

  const login = (username: string, password: string) => {
    // Dummy logic — replace with real credentials logic if needed
    const isAdminUser = username === "admin" && password === "admin";
    const isRegularUser = username === "user" && password === "password";

    if (isAdminUser || isRegularUser) {
      setUser(username);
      setIsAdmin(isAdminUser);
      localStorage.setItem("user", username);
      localStorage.setItem("isAdmin", isAdminUser.toString());
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem("user");
    localStorage.removeItem("isAdmin");
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
