
import { Navigate } from "react-router-dom";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import React from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  allowUserAccess?: boolean; // New prop to explicitly allow user access
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  allowUserAccess = true // By default, allow users
}) => {
  const { user } = useSupabaseAuth();

  if (!user) {
    // User is not authenticated, redirect to login
    return <Navigate to="/login" replace />;
  }
  
  // Get user role from Supabase metadata
  const userRole = user?.user_metadata?.role || 'User';
  
  if (requireAdmin && userRole !== 'Admin') {
    // User is authenticated but not an admin, redirect to orders
    return <Navigate to="/orders" replace />;
  }

  // Check if the user is a regular user and if this route is not allowed for users
  if (userRole === "User" && !allowUserAccess) {
    // Regular user trying to access a restricted route, redirect to orders
    return <Navigate to="/orders" replace />;
  }

  // User is authenticated and has appropriate permissions
  return <>{children}</>;
};

export default ProtectedRoute;
