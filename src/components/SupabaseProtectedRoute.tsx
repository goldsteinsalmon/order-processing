
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
    // Enhanced debug logging
    console.log("[SupabaseProtectedRoute] Rendering with:", { 
      isLoading, 
      hasUser: !!user, 
      hasSession: !!session,
      userRole: user?.user_metadata?.role,
      requireAdmin,
      allowUserAccess,
      path: location.pathname
    });
    
    // If we have a session but not a user, log the inconsistency
    if (session && !user) {
      console.warn("[SupabaseProtectedRoute] Detected session without user - possible auth state inconsistency");
    }
  }, [isLoading, user, session, requireAdmin, allowUserAccess, location]);
  
  // Show loading state, but not for too long
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-500">Verifying your access...</p>
      </div>
    );
  }
  
  // More strict check: both user and session are required
  if (!user || !session) {
    console.log("[SupabaseProtectedRoute] Authentication required, redirecting to login", location);
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
