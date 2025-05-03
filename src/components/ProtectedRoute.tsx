
import { Navigate, useLocation } from "react-router-dom";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import React from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  allowUserAccess?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  allowUserAccess = true
}) => {
  const { user, isLoading } = useSupabaseAuth();
  const location = useLocation();
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    // User is not authenticated, redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
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
