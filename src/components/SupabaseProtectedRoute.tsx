
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  allowUserAccess?: boolean;
}

const SupabaseProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  allowUserAccess = false 
}) => {
  const { user, isLoading } = useSupabaseAuth();
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Get user role from user metadata
  const userRole = user.user_metadata?.role || 'User';
  
  // Check if admin access is required but user is not an admin
  if (requireAdmin && userRole !== 'Admin') {
    return <Navigate to="/orders" replace />;
  }
  
  // Check if regular user is accessing a restricted route
  if (!allowUserAccess && userRole === 'User') {
    return <Navigate to="/orders" replace />;
  }
  
  // If all checks pass, render the children
  return <>{children}</>;
};

export default SupabaseProtectedRoute;
