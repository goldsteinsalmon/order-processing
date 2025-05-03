
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  allowUserAccess?: boolean;
}

const SupabaseProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  allowUserAccess = true 
}) => {
  const { user, isLoading, session } = useSupabaseAuth();
  const location = useLocation();
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }
  
  // Simple, strict check for authentication
  if (!user || !session) {
    console.log("[SupabaseProtectedRoute] No authenticated user, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check for admin access if required
  const userRole = user.user_metadata?.role || 'User';
  
  if (requireAdmin && userRole !== 'Admin') {
    console.log('[SupabaseProtectedRoute] User is not admin, redirecting to orders');
    return <Navigate to="/orders" replace />;
  }
  
  // Check if user is accessing a restricted route
  if (!allowUserAccess && userRole === 'User') {
    console.log('[SupabaseProtectedRoute] User accessing restricted route, redirecting to orders');
    return <Navigate to="/orders" replace />;
  }
  
  // If all checks pass, render the children
  return <>{children}</>;
};

export default SupabaseProtectedRoute;
