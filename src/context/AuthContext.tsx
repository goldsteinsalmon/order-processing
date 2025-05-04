
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "./DataContext";

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: {
    id: string;
    name: string;
    username: string;
    role: "Admin" | "User" | "Manager";
  } | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { users } = useData();
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState<AuthContextType["currentUser"]>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check if there's a saved session when the component mounts
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
  }, []);
  
  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    // Find user with matching username and password
    const user = users.find(
      (u) => u.email.toLowerCase() === username.toLowerCase() && u.password === password && u.active
    );
    
    if (user) {
      // Create user object without sensitive info
      const authenticatedUser = {
        id: user.id,
        name: user.name,
        username: user.email,
        role: user.role
      };
      
      // Save user info to state and localStorage
      setCurrentUser(authenticatedUser);
      setIsAuthenticated(true);
      localStorage.setItem("currentUser", JSON.stringify(authenticatedUser));
      
      return true;
    }
    
    return false;
  };
  
  // Logout function
  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("currentUser");
    navigate("/login");
  };
  
  // Helper function to check if user is admin
  const isAdmin = () => {
    return currentUser?.role === "Admin";
  };
  
  const value = {
    isAuthenticated,
    currentUser,
    login,
    logout,
    isAdmin
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
