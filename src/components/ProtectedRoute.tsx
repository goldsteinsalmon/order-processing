
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import React from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    // User is not authenticated, redirect to login
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && !isAdmin()) {
    // User is authenticated but not an admin, redirect to orders
    return <Navigate to="/orders" replace />;
  }

  // User is authenticated (and is admin if required)
  return <>{children}</>;
};

export default ProtectedRoute;
