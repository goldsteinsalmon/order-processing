
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import React from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  allowUserAccess?: boolean; // New prop to explicitly allow user access
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  allowUserAccess = false // By default, don't allow users
}) => {
  const { isAuthenticated, isAdmin, currentUser } = useAuth();

  if (!isAuthenticated) {
    // User is not authenticated, redirect to login
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && !isAdmin()) {
    // User is authenticated but not an admin, redirect to orders
    return <Navigate to="/orders" replace />;
  }

  // Check if the user is a regular user and if this route is not allowed for users
  if (currentUser?.role === "User" && !allowUserAccess) {
    // Regular user trying to access a restricted route, redirect to orders
    return <Navigate to="/orders" replace />;
  }

  // User is authenticated and has appropriate permissions
  return <>{children}</>;
};

export default ProtectedRoute;
