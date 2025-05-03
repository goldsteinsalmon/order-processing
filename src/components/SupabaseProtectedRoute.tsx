
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
  
  // Debug info
  console.log("[SupabaseProtectedRoute] Current state:", { 
    path: location.pathname,
    isLoading, 
    hasUser: !!user, 
    hasSession: !!session,
    userEmail: user?.email,
    currentUrl: window.location.href
  });
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-500">Loading authentication...</p>
      </div>
    );
  }
  
  // Check authentication status
  if (!user || !session) {
    console.log("[SupabaseProtectedRoute] No authenticated user, redirecting to login");
    
    // Keep the current location so we can redirect back after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // Check for admin access if required
  const userRole = user.user_metadata?.role || 'User';
  console.log("[SupabaseProtectedRoute] User authenticated with role:", userRole);
  
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
  console.log('[SupabaseProtectedRoute] Access granted to:', location.pathname);
  return <>{children}</>;
};

export default SupabaseProtectedRoute;
