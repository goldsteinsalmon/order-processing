
import React, { useEffect } from 'react';
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
  
  useEffect(() => {
    // Debug logging
    console.log("[SupabaseProtectedRoute] Rendering with:", { 
      isLoading, 
      hasUser: !!user, 
      hasSession: !!session,
      userRole: user?.user_metadata?.role,
      requireAdmin,
      allowUserAccess,
      path: location.pathname
    });
  }, [isLoading, user, session, requireAdmin, allowUserAccess, location]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user || !session) {
    console.log("[SupabaseProtectedRoute] No authenticated user found, redirecting to login", location);
    // Remember the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Get user role from user metadata
  const userRole = user.user_metadata?.role || 'User';
  
  // Check if admin access is required but user is not an admin
  if (requireAdmin && userRole !== 'Admin') {
    console.log('[SupabaseProtectedRoute] Access denied: Admin access required but user role is', userRole);
    return <Navigate to="/orders" replace />;
  }
  
  // Check if regular user is accessing a restricted route
  if (!allowUserAccess && userRole === 'User') {
    console.log('[SupabaseProtectedRoute] Access denied: Regular user accessing restricted route');
    return <Navigate to="/orders" replace />;
  }
  
  // If all checks pass, render the children
  return <>{children}</>;
};

export default SupabaseProtectedRoute;
