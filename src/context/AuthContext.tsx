
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "./DataContext";
import { useSupabaseAuth } from "./SupabaseAuthContext";

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

// Create the context but don't export the default provider
// This file is kept for compatibility with existing code but we're
// transitioning to SupabaseAuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// We'll keep the AuthProvider definition but it won't be used
// This is only kept for reference until full migration to Supabase auth
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { users } = useData();
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  
  const [currentUser, setCurrentUser] = useState<AuthContextType["currentUser"]>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Update authentication state based on Supabase auth
  useEffect(() => {
    if (user) {
      const supabaseUser = {
        id: user.id,
        name: user.user_metadata?.name || user.email || "User",
        username: user.email || "",
        role: (user.user_metadata?.role as "Admin" | "User" | "Manager") || "User"
      };
      
      setCurrentUser(supabaseUser);
      setIsAuthenticated(true);
    } else {
      setCurrentUser(null);
      setIsAuthenticated(false);
    }
  }, [user]);
  
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
  
  // Logout function - delegate to Supabase auth
  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("currentUser");
    navigate("/login");
  };
  
  // Helper function to check if user is admin
  const isAdmin = () => {
    return currentUser?.role === "Admin" || user?.user_metadata?.role === "Admin";
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
